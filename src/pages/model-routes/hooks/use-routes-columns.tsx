// columns.ts
import { tableSorter } from '@/config/settings';
import ModelTag from '@/pages/_components/model-tag';
import { getGPUStackPlugin } from '@/plugins';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import {
  AutoTooltip,
  DropdownButtons,
  icons,
  type TableColumnProps
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { MenuProps } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { RouteItem } from '../config/types';
import type { ModelRouteConfigAction } from '../plugin';

// Plugin slot: enterprise plugins can contribute extra columns to the
// route-list table via `modelRoutes.extraColumns`. `placement` decides
// where in the existing column order they land; `span` is the column
// width in the SealTable grid. The host adjusts the built-in spans to
// make room when plugin columns are present.
type PluginColumn = {
  key: string;
  titleId: string;
  span?: number;
  placement?: 'after-name' | 'before-time' | 'before-operation';
  render: (record: RouteItem) => React.ReactNode;
};

// Local ranked-action shape used for the unified priority sort. Mirrors
// the api-keys page approach: every entry — built-in or plugin —
// participates in the same numeric ordering.
type RankedAction = {
  label: string;
  key: string;
  icon?: React.ReactNode;
  props?: { danger?: boolean };
  priority: number;
  show?: (route: RouteItem) => boolean;
  onClick?: (record: RouteItem) => void;
};

interface ColumnsHookProps {
  handleSelect: (val: string, record: RouteItem) => void;
  configActions?: ModelRouteConfigAction[];
  // Dispatches a click for a plugin-contributed dropdown entry to the
  // controller `useCreate()` returned for that entry.
  onConfigAction?: (actionKey: string, record: RouteItem) => void;
}

// SealTable's grid is 24 units. With the built-in `targets` column
// contributing slack (preferred 10, min 4), there's room for plugin
// columns up to a combined span of 6 before we have to take from
// other built-ins. Layout above this threshold is preserved by also
// shrinking `createTime` (min 2 — the date string ellipsizes
// gracefully); `name` and `operation` stay fixed so the action
// dropdown alignment isn't disturbed. Plugins whose combined span
// would exceed what these reductions can absorb fall back to their
// declared widths and may visibly wrap — that's a plugin-author
// concern, not a host one.
const TARGETS_PREFERRED_SPAN = 10;
const TARGETS_MIN_SPAN = 4;
const CREATE_TIME_PREFERRED_SPAN = 5;
const CREATE_TIME_MIN_SPAN = 2;

const useAccessColumns = ({
  handleSelect,
  configActions = [],
  onConfigAction
}: ColumnsHookProps): TableColumnProps[] => {
  const intl = useIntl();
  // Merge the route-specific `modelRoutes.extraColumns` slot with the
  // generic per-page `listExtraColumns.modelRoutes` slot — both feed
  // the same splice point, so plugins can pick whichever slot fits
  // (page-specific quota cell vs. cross-page Organization-style col).
  // Memoized on `genericCols` because the route-specific slot is wired
  // once at boot (stable identity) so only `genericCols` can change.
  const genericCols = usePluginListColumns('modelRoutes');
  const pluginColumns = useMemo<PluginColumn[]>(
    () => [
      ...(getGPUStackPlugin()?.modelRoutes?.extraColumns ?? []),
      ...(genericCols as unknown as PluginColumn[])
    ],
    [genericCols]
  );

  // Sort-order is row-independent: priority and danger are fixed at
  // registration time. Compute the sorted list once and only do the
  // `show` filter per row.
  const sortedActions = useMemo<RankedAction[]>(() => {
    const builtIns: RankedAction[] = [
      {
        label: 'common.button.edit',
        key: 'edit',
        icon: icons.EditOutlined,
        priority: 0
      },
      {
        label: 'models.openinplayground',
        key: 'chat',
        icon: icons.ExperimentOutlined,
        priority: 10,
        show: (r) => r.ready_targets > 0
      },
      {
        label: 'models.table.button.apiAccessInfo',
        key: 'api',
        icon: icons.ApiOutlined,
        priority: 20,
        show: (r) => r.ready_targets > 0
      },
      {
        label: 'models.button.accessSettings',
        key: 'accessControl',
        icon: icons.Permission,
        priority: 30
      },
      {
        label: 'common.button.delete',
        key: 'delete',
        icon: icons.DeleteOutlined,
        props: { danger: true },
        priority: 9999
      }
    ];
    const fromPlugins: RankedAction[] = configActions.map((a) => ({
      label: a.labelId,
      key: a.key,
      icon: a.icon,
      priority: a.priority ?? 100,
      props: a.danger ? { danger: true } : undefined,
      show: a.show,
      onClick: (record: RouteItem) => onConfigAction?.(a.key, record)
    }));
    return [...builtIns, ...fromPlugins].sort((a, b) => {
      const aDanger = a.props?.danger ? 1 : 0;
      const bDanger = b.props?.danger ? 1 : 0;
      if (aDanger !== bDanger) return aDanger - bDanger;
      return a.priority - b.priority;
    });
  }, [configActions, onConfigAction]);

  const filterActions = useMemoizedFn((record: RouteItem) =>
    sortedActions.filter((a) => (a.show ? a.show(record) : true))
  );

  // Plugin entries carry their own `onClick` (wired to `onConfigAction`
  // during action construction above), so the dispatcher just runs it
  // when present. Built-ins fall through to the page's `handleSelect`
  // dispatcher keyed by `val`. Mirrors the api-keys page's onSelect
  // path — no key lookup needed.
  const onSelectAction = useMemoizedFn(
    (val: string, record: RouteItem, item?: RankedAction) => {
      if (item?.onClick) {
        item.onClick(record);
        return;
      }
      handleSelect(val, record);
    }
  );

  return useMemo(() => {
    // When plugin columns are present we first steal width from
    // `targets` (down to its 4-unit min), then from `createTime`
    // (down to 2). Stays within the 24-unit grid as long as the
    // combined plugin span is ≤ 9.
    const pluginSpan = pluginColumns.reduce((sum, c) => sum + (c.span ?? 4), 0);
    const targetsSpan = Math.max(
      TARGETS_MIN_SPAN,
      TARGETS_PREFERRED_SPAN - pluginSpan
    );
    const overflow = Math.max(
      0,
      pluginSpan - (TARGETS_PREFERRED_SPAN - TARGETS_MIN_SPAN)
    );
    const createTimeSpan = Math.max(
      CREATE_TIME_MIN_SPAN,
      CREATE_TIME_PREFERRED_SPAN - overflow
    );
    const pluginColsRendered: TableColumnProps[] = pluginColumns.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      dataIndex: c.key,
      span: c.span ?? 4,
      render: (_value: any, record: RouteItem) => c.render(record)
    }));
    // Default placement for plugin cols on this page predates the
    // generic seam and stays `before-time` (the existing per-page
    // `modelRoutes.extraColumns` slot relies on it for the quota
    // cell). Entries from the generic `listExtraColumns.modelRoutes`
    // slot pick `after-name` explicitly when they want to read
    // alongside the row's name.
    const afterName = pluginColsRendered.filter(
      (_c, i) => pluginColumns[i].placement === 'after-name'
    );
    const beforeTime = pluginColsRendered.filter(
      (_c, i) => (pluginColumns[i].placement ?? 'before-time') === 'before-time'
    );
    const beforeOperation = pluginColsRendered.filter(
      (_c, i) => pluginColumns[i].placement === 'before-operation'
    );
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        span: 5,
        render: (text: string, record: RouteItem) => (
          <span className="flex-center" style={{ maxWidth: '100%' }}>
            <AutoTooltip ghost title={text}>
              <span className="m-r-5 text-primary">{text}</span>
            </AutoTooltip>
            <ModelTag categoryKey={record.categories?.[0]}></ModelTag>
          </span>
        )
      },
      ...afterName,
      {
        title: intl.formatMessage({ id: 'routes.table.routeTargets' }),
        dataIndex: 'targets',
        span: targetsSpan,
        render: (value: number, record: RouteItem) => (
          <span>
            {record.ready_targets} / {value}
          </span>
        )
      },
      ...beforeTime,
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(6),
        span: createTimeSpan,
        render: (value: string) => (
          <AutoTooltip ghost minWidth={20}>
            {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      ...beforeOperation,
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operations',
        span: 4,
        render: (value: string, record: RouteItem) => (
          <DropdownButtons
            items={filterActions(record) as MenuProps['items']}
            onSelect={(val, item) =>
              onSelectAction(val, record, item as RankedAction)
            }
          ></DropdownButtons>
        )
      }
    ];
  }, [intl, pluginColumns, filterActions, onSelectAction]);
};

export default useAccessColumns;
