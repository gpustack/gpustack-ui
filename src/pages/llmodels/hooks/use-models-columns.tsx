// columns.ts
import { systemConfigAtom } from '@/atoms/system';
import { StatusMaps } from '@/config';
import { OPENAI_COMPATIBLE, tableSorter } from '@/config/settings';
import { TargetStatusValueMap } from '@/pages/model-routes/config';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { QuestionCircleOutlined, WarningOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  GrafanaIcon,
  IconFont,
  icons,
  StatusDot,
  type TableColumnProps
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import _ from 'lodash';
import { cloneElement, useMemo, type CSSProperties } from 'react';
import ModelTag from '../../_components/model-tag';
import { MarkerReasons, markerTexts } from '../components/pd/pd-markers';
import PDReplicasCell from '../components/pd/pd-replicas-cell';
import {
  isModelServable,
  isPDModel,
  isRestartInFlight,
  modelCategoriesMap,
  modelReplicaCounts,
  ModelStateLabelMap,
  ModelStateMap,
  ModelStateValueMap,
  MyModelsStatusLabelMap,
  MyModelsStatusValueMap
} from '../config';
import { generateSource } from '../config/button-actions';
import { ListItem, RoleSpec } from '../config/types';
interface ActionItem {
  label: string;
  key: string;
  icon: React.ReactNode;
  props?: {
    danger?: boolean;
    disabled?: boolean;
  };
}

const useStyles = createStyles(({ css }) => ({
  // Suppressing the column's own inline editor on one row only.
  //
  // core-ui's editable cell renders its pencil as the *next sibling* of
  // whatever the column's `render` returned, and `editable` is a column-level
  // prop with no per-row form — so `render` is the only per-row hook there is.
  // A PD row takes the pencil away because that editor is a single number and
  // a group's size is a shape: `PDReplicasCell` puts its own editor, one input
  // per role, behind a click on the cell. Every other row is untouched, which
  // is what keeps a role-less model's replica cell exactly what it is today.
  pdReplicas: css`
    & + span {
      display: none;
    }
  `
}));

/**
 * The replica cell's own line: the deployment's state as a dot, and the counts
 * as the dot's text.
 *
 * 🔴 A `StatusTag` here renders the state as a worded pill («运行中»), and in a
 * cell whose whole content is «9 / 9» that word is the same fact twice —
 * «ready equals total» already says running. Worse, the pill is the widest
 * thing in a narrow column, so it pushes the numbers it describes off to the
 * side. The dot carries the one thing the numbers cannot: the deployment's own
 * state, as a colour, with the reason on hover when there is one.
 *
 * 🔑 `lineHeight` because `StatusDot` sets `1` and this line sits among the
 * table's 22px text; `flexShrink` because its label truncates by default and a
 * count is not a thing to ellipsize.
 */
const REPLICA_LINE: CSSProperties = {
  flexShrink: 0,
  gap: 8,
  lineHeight: '22px'
};

// 🔴 An «xPyD» tag used to be built here — first beside the name, then beside
// the group total in the replica cell. It is gone because the cell now prints
// one line per role: the desired counts running down that block ARE the 1P3D,
// and a badge repeating them would state the shape twice on one row.

const ActionList: ActionItem[] = [
  {
    label: 'common.button.edit',
    key: 'edit',
    icon: icons.EditOutlined
  },
  {
    label: 'models.openinplayground',
    key: 'chat',
    icon: icons.ExperimentOutlined
  },
  {
    label: 'common.button.start',
    key: 'start',
    icon: icons.Play
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    icon: icons.Stop
  },
  {
    label: 'models.restart',
    key: 'restart',
    icon: icons.RetweetOutlined
  },
  {
    label: 'models.table.instance.benchmark',
    key: 'benchmark',
    icon: <IconFont type="icon-speed" />
  },
  {
    label: 'resources.metrics.details',
    key: 'metrics',
    icon: (
      <span className="flex-center">
        <GrafanaIcon style={{ width: 14, height: 14 }}></GrafanaIcon>
      </span>
    )
  },
  {
    key: 'copy',
    label: 'common.button.clone',
    icon: icons.CopyOutlined
  },
  {
    key: 'export',
    label: 'models.button.exportYaml',
    icon: icons.DownloadOutlined
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    props: {
      danger: true
    },
    icon: icons.DeleteOutlined
  }
];

interface ModelsColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
  clusterList: Global.BaseOption<
    number,
    { provider: string; state: string | number }
  >[];
  // Per-role scaling from the replica cell. Separate from the column's
  // `editable` hook, which is a single number and cannot express a shape.
  onUpdateRoles: (record: ListItem, roles: RoleSpec[]) => Promise<void>;
}

const useModelsColumns = ({
  handleSelect,
  clusterList,
  sortOrder,
  targetList,
  onUpdateRoles
}: ModelsColumnsHookProps & { targetList: any[] }): TableColumnProps[] => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);
  const pluginCols = usePluginListColumns('llmodels');
  const { styles } = useStyles();

  const setModelActionList = useMemoizedFn((record: any) => {
    const actions = _.filter(ActionList, (action: any) => {
      if (action.key === 'chat') {
        // `isModelServable` is the whole servability half of this gate: under
        // PD a running-instance count no longer implies the model can answer
        // (a 3P1D with its router down is four RUNNING instances and zero
        // service), so the counter is not it. The route-target half stays —
        // it is a different question, "is there a live route to send the
        // playground at", and the playground is opened by route name.
        return (
          isModelServable(record) &&
          targetList?.find(
            (target) =>
              target.model_id === record.id &&
              target.state === TargetStatusValueMap.Active
          )
        );
      }

      if (action.key === 'start') {
        return record.replicas === 0;
      }

      if (action.key === 'stop') {
        return record.replicas > 0;
      }
      if (action.key === 'restart') {
        // The same "there is something to act on" gate as stop, and
        // deliberately not `stale`: whether an edit is worth a restart window
        // is the operator's call, and an entry that only appears once the
        // model is already stale teaches nobody it exists.
        return record.replicas > 0;
      }
      if (action.key === 'benchmark') {
        // Same servability gate as the playground, for the same reason: a
        // group whose router is down has RUNNING members and answers nothing,
        // and a run pointed at it would measure a connection error. No route
        // target needed though — the load goes straight at the deployment,
        // not through the gateway.
        return (
          isModelServable(record) &&
          record.categories?.includes(modelCategoriesMap.llm)
        );
      }
      if (action.key === 'metrics') {
        return systemConfig?.showMonitoring;
      }

      return true;
    });

    // A restart the server is still carrying out. Disabled rather than hidden:
    // the entry vanishing and coming back is the same ambiguity as a button
    // that does nothing, and this is the one moment the reader most needs to
    // be told the action is already under way.
    //
    // 🔴 It is not cosmetic. A second teardown during this window deletes the
    // replacements the first one just built, costing the group another full
    // startup — and "clicked it, nothing seemed to happen, clicked again" is
    // exactly how an operator reaches it. The server answers 409, so the worst
    // case without this is a refusal the user has to read; the point of the
    // disabled state is that they never have to.
    //
    // 🔑 Through `isRestartInFlight`, never off the raw field. `restarting_since`
    // is cleared only on reaching RUNNING, so a deployment that never converges
    // carries it forever — and testing it directly turned this guard into a
    // permanent one on exactly the wedged group an operator needs to restart.
    // The server lapses it after the same window and would accept the request;
    // the entry has to agree, or it disables an action that works.
    //
    // Evaluated per menu open rather than on a timer: this runs when the ⋮ is
    // clicked, which is the only moment its answer is read.
    if (isRestartInFlight(record.restarting_since)) {
      return _.map(actions, (action: ActionItem) =>
        action.key === 'restart'
          ? {
              ...action,
              label: 'models.restart.inflight',
              props: { ...action.props, disabled: true }
            }
          : action
      );
    }

    if (!record.stale) {
      return actions;
    }
    // Stale is the state this action exists for, so the entry points at
    // itself — same warning colour as the marker on the replica cell. A hint
    // only: the action is no more available here than it was a moment ago.
    return _.map(actions, (action: ActionItem) =>
      action.key === 'restart'
        ? {
            ...action,
            icon: cloneElement(action.icon as React.ReactElement, {
              style: { color: 'var(--ant-color-warning)' }
            })
          }
        : action
    );
  });

  // The replica cell's status, straight off `Model.state` — the UI never
  // recomputes that judgement, because a second implementation of it would
  // drift from the backend's.
  //
  // Two reads around it, neither of them a judgement:
  //  - `state` is NULL between a model's creation and the first reconcile
  //    pass over it. `isModelServable` handles that window by reading the
  //    counter; the same fallback here keeps the cell from going blank.
  //  - `replicas === 0` with nothing left running is the deployment switch
  //    being off, which the lifecycle has no value for — it reports PENDING.
  //    That is the one case today's cell greys out, and it stays grey.
  const replicaStatus = useMemoizedFn((record: ListItem, ready: number) => {
    if (!record.replicas && !ready) {
      return {
        status: StatusMaps.inactive,
        text: intl.formatMessage({
          id: MyModelsStatusLabelMap[MyModelsStatusValueMap.Stopped]
        }),
        message: ''
      };
    }
    const state =
      record.state ||
      (ready > 0 ? ModelStateValueMap.Running : ModelStateValueMap.Pending);
    return {
      status: ModelStateMap[state] || StatusMaps.inactive,
      text: ModelStateLabelMap[state]
        ? intl.formatMessage({ id: ModelStateLabelMap[state] })
        : state,
      message: record.state_message || ''
    };
  });

  return useMemo(() => {
    // Two prebuilt span maps for the 24-unit SealTable grid: one for
    // the default layout, one for when a plugin contributes an extra
    // column (currently always the 4-span Organization cell). Width
    // absorbed comes from the widest non-name columns (`source`,
    // `replicas`, `created_at`). See the matching map in
    // `use-cluster-columns.tsx` for rationale.
    const SPANS_DEFAULT = {
      source: 5,
      replicas: 4,
      createTime: 4
    };
    const SPANS_WITH_PLUGIN = {
      source: 3,
      replicas: 3,
      createTime: 3
    };
    const spans = pluginCols.length > 0 ? SPANS_WITH_PLUGIN : SPANS_DEFAULT;
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      dataIndex: c.key,
      key: c.key,
      span: c.span ?? 4,
      render: (_text: any, record: ListItem) => c.render(record)
    }));
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        sorter: tableSorter(1),
        span: 5,
        render: (text: string, record: ListItem) => (
          <Flex align="center" gap={4} style={{ maxWidth: '100%' }}>
            <AutoTooltip
              ghost
              title={
                <span style={{ color: 'var(--ant-color-text-light-solid)' }}>
                  {text}
                </span>
              }
            >
              <span className="text-primary font-400">{text}</span>
            </AutoTooltip>
            <ModelTag categoryKey={record.categories?.[0] || ''} />
            {/* 🔴 The «xPyD» tag lived here, with the transport mode on its
                tooltip. Both moved into the replica cell: the shape is now
                printed beside the ready count it is the shape *of* («2P2D ·
                5 / 5»), which is the comparison a reader was making anyway,
                and keeping a second copy here would have said it twice on one
                row. The mode went with it, onto that cell's tooltip. */}
          </Flex>
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        key: 'cluster_id',
        sorter: tableSorter(2),
        span: 3,
        render: (text: string, record: ListItem) => (
          <span className="flex flex-column" style={{ width: '100%' }}>
            {
              clusterList.find((item) => item.value === record.cluster_id)
                ?.label
            }
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.form.source' }),
        dataIndex: 'source',
        key: 'source',
        sorter: tableSorter(3),
        span: spans.source,
        render: (text: string, record: ListItem) => (
          <span className="flex flex-column" style={{ width: '100%' }}>
            <AutoTooltip ghost>{generateSource(record)}</AutoTooltip>
          </span>
        )
      },
      {
        title: (
          <Tooltip
            title={intl.formatMessage(
              { id: 'models.form.replicas.tips' },
              { api: `${window.location.origin}/${OPENAI_COMPATIBLE}` }
            )}
          >
            <span>{intl.formatMessage({ id: 'models.form.replicas' })}</span>
            <QuestionCircleOutlined className="m-l-5" />
          </Tooltip>
        ),
        dataIndex: 'replicas',
        key: 'replicas',
        align: 'left',
        sorter: tableSorter(4),
        span: spans.replicas,
        // The only floor in this table, and it is here because this is the one
        // cell whose width is not negotiable: a PD row in edit mode lays out
        // «● Decode  3 /  [ 3 ]  ✓ ↺» on one line, and the cell clips rather
        // than wraps (`overflow: hidden`), so a share too small would cut the
        // save button off. 4fr alone drops under 200px on a laptop. The floor
        // costs the other columns a little of the leftover width and nothing
        // else — they were already truncating into an `AutoTooltip`.
        minWidth: 280,
        editable: {
          valueType: 'number',
          title: intl.formatMessage({ id: 'models.table.replicas.edit' })
        },
        render: (text: number, record: ListItem) => {
          // Not `ready_replicas / replicas`: under PD `Model.replicas` is a
          // 0/1 deployment switch, so a 4P1D would render "5 / 1". The
          // declared size of a group is the sum of its roles' counts, which is
          // what `modelReplicaCounts` returns — and it degenerates to
          // `replicas` for a model without roles, leaving that cell's numbers
          // unchanged.
          const { ready, total } = modelReplicaCounts(record);
          const isPD = isPDModel(record);
          const markers = markerTexts(intl, record.stale, record.degradations);

          // The colour still comes from `replicaStatus` — i.e. from
          // `Model.state` and `state_message`, not from the numbers. Only the
          // WORD is gone. Driving it off the counts instead (which is what
          // this cell did before PD) would have collapsed «starting» and
          // «failed» into one orange, and dropped the message entirely; a
          // status nobody can read the reason of is the silent-failure mode
          // this feature exists to beat.
          const dotStatus = replicaStatus(record, ready);
          const statusLine = (
            <StatusDot
              statusValue={{
                status: dotStatus.status,
                text: `${ready} / ${total}`
              }}
              style={REPLICA_LINE}
            />
          );
          // `StatusDot` is a plain function component, so the tooltip gets an
          // element of its own to anchor on.
          const dotNode = dotStatus.message ? (
            <Tooltip title={dotStatus.message}>
              <span style={{ display: 'inline-flex' }}>{statusLine}</span>
            </Tooltip>
          ) : (
            statusLine
          );
          // A PD row has no row-level dot any more — one per role, below — so
          // the state and its message travel as values instead of a node.

          // Only when something is wrong. `stale` is computed for every model,
          // not only groups — an edited plain model is just as silently
          // un-applied — so this is outside any PD guard.
          //
          // 🔴 There used to be a neutral ⓘ here whenever the row had a
          // tooltip at all, which under PD meant every single row. An icon
          // that is always present signals nothing; the tooltip now hangs off
          // the value itself (see `PDReplicasCell`), leaving this glyph to
          // mean what its colour says.
          const glyphNode = markers.length ? (
            <WarningOutlined
              style={{ flexShrink: 0, color: 'var(--ant-color-warning)' }}
            />
          ) : null;

          const cell = (
            <Flex
              component="span"
              align="center"
              gap={8}
              style={{ minWidth: 23, color: 'var(--ant-color-text)' }}
            >
              {dotNode}
              {glyphNode}
            </Flex>
          );
          if (!isPD) {
            // A plain model with a marker still owes the reader its reason.
            return markers.length ? (
              <Tooltip title={<MarkerReasons texts={markers} />}>
                {cell}
              </Tooltip>
            ) : (
              cell
            );
          }
          // A group's roles fail independently, so the cell prints them
          // independently — one `ready / desired` line each — instead of the
          // group total a role-less row shows. That split has to work on the
          // list response, which carries no instances, hence `role_status`
          // rather than a count of the expanded row's children.
          return (
            <PDReplicasCell
              record={record}
              markers={markers}
              mode={record.disaggregation?.mode}
              className={styles.pdReplicas}
              status={dotStatus.status}
              statusMessage={dotStatus.message}
              onSave={(roles) => onUpdateRoles(record, roles)}
            ></PDReplicasCell>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: tableSorter(5),
        width: 180,
        render: (text: number) => (
          <AutoTooltip ghost>
            {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        span: 3,
        render: (text: any, record: ListItem) => (
          <DropdownButtons
            items={setModelActionList(record)}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [
    sortOrder,
    clusterList,
    intl,
    handleSelect,
    setModelActionList,
    replicaStatus,
    pluginCols,
    styles.pdReplicas
  ]);
};

export default useModelsColumns;
