// columns.ts
import { tableSorter } from '@/config/settings';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { DashboardOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  IconFont,
  icons,
  TextAttribute,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { MenuProps, Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ListItem } from '../config/types';
import type { APIKeyConfigAction } from '../plugin';

type APIKeyAction = Omit<Global.ActionItem<ListItem>, 'disabled' | 'label'> & {
  // Per-row callback (function) is the host's default; placeholders use a
  // plain boolean to render the menu item grayed out unconditionally.
  disabled?: boolean | ((record: ListItem) => boolean);
  // ReactNode allowed so disabled placeholders can render a Tooltip-
  // wrapped label (paired with `locale: false`).
  label: string | React.ReactNode;
  onClick?: (record: ListItem) => void;
};

type RankedAction = APIKeyAction & { priority: number };

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem, item?: APIKeyAction) => void;
  sortOrder: string[];
  // Reveal the Creator column to callers who can see other users' keys
  // (platform admin or current-Org owner). Members only see their own
  // keys, so the column would be redundant for them.
  showCreator?: boolean;
  configActions?: APIKeyConfigAction[];
  // Dispatches the click for a plugin-contributed dropdown entry to the
  // controller `useCreate()` returned for that entry.
  onConfigAction?: (actionKey: string, record: ListItem) => void;
}

const useModelsColumns = ({
  handleSelect,
  sortOrder,
  showCreator,
  configActions = [],
  onConfigAction
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();
  const pluginCols = usePluginListColumns('apiKeys');

  const actionList = useMemo<APIKeyAction[]>(() => {
    // Built-ins use a step-of-10 priority scale so plugins have room
    // to insert at any position (e.g. 5 before Edit, 15 between Edit
    // and Delete, 25 after Delete). The final list is sorted purely
    // by priority — Delete sits last by virtue of its higher number,
    // not by a special-case for `danger`.
    const builtIns: RankedAction[] = [
      {
        label: 'common.button.edit',
        key: 'edit',
        icon: icons.EditOutlined,
        priority: 10
      },
      {
        label: 'common.button.delete',
        key: 'delete',
        icon: icons.DeleteOutlined,
        props: { danger: true },
        priority: 20
      }
    ];

    const fromPlugins: RankedAction[] = configActions.map((a) => ({
      label: a.labelId,
      key: a.key,
      icon: a.icon,
      priority: a.priority ?? 100,
      props: a.danger ? { danger: true } : undefined,
      onClick: (record: ListItem) => onConfigAction?.(a.key, record)
    }));

    // Show disabled placeholders for IP Access Control / Quota Limit in
    // the OSS build only — when the enterprise plugin contributes the
    // real entry under the same key, skip the placeholder so the live
    // action takes over. Keeps the dropdown's surface area consistent
    // between editions while making the upgrade path discoverable.
    const pluginKeys = new Set(configActions.map((a) => a.key));
    const enterpriseTooltip = intl.formatMessage({
      id: 'common.enterprise.feature'
    });
    const enterprisePlaceholder = (labelId: string): React.ReactNode => (
      <Tooltip title={enterpriseTooltip} placement="left">
        <span style={{ display: 'inline-block' }}>
          {intl.formatMessage({ id: labelId })}
        </span>
      </Tooltip>
    );
    const placeholders: RankedAction[] = [];
    if (!pluginKeys.has('ipConfig')) {
      placeholders.push({
        key: 'ipConfig',
        label: enterprisePlaceholder('apikeys.button.ipConfig'),
        locale: false,
        icon: <IconFont type="icon-safe-ip" />,
        disabled: true,
        priority: 12
      });
    }
    if (!pluginKeys.has('quotaLimit')) {
      placeholders.push({
        key: 'quotaLimit',
        label: enterprisePlaceholder('quotaLimits.button.title'),
        locale: false,
        icon: <DashboardOutlined />,
        disabled: true,
        priority: 14
      });
    }

    return [...builtIns, ...fromPlugins, ...placeholders].sort(
      (a, b) => a.priority - b.priority
    );
  }, [intl, configActions, onConfigAction]);

  return useMemo(() => {
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      key: c.key,
      ellipsis: { showTitle: false },
      render: (_text: any, record: ListItem) => c.render(record)
    }));
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        sorter: tableSorter(1),
        render: (text: string, record: ListItem) => (
          <span className="flex items-center gap-8">
            <AutoTooltip ghost style={{ maxWidth: 400 }} title={text}>
              <span className="text-primary">{text}</span>
            </AutoTooltip>
            {record.is_custom && (
              <TextAttribute>
                {intl.formatMessage({ id: 'playground.params.custom' })}
              </TextAttribute>
            )}
          </span>
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'apikeys.table.key' }),
        dataIndex: 'masked_value',
        key: 'masked_value',
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost style={{ maxWidth: 200 }}>
            {text || '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'apikeys.form.expiretime' }),
        dataIndex: 'expires_at',
        key: 'expires_at',
        sorter: tableSorter(2),
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost>
            {text
              ? dayjs(text).format('YYYY-MM-DD HH:mm:ss')
              : intl.formatMessage({
                  id: 'apikeys.form.expiration.never'
                })}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'apikeys.access.permissions' }),
        dataIndex: 'allowed_model_names',
        key: 'allowed_model_names',
        ellipsis: {
          showTitle: false
        },
        render: (text: string[], record: ListItem) => (
          <div className="flex-column gap-4">
            {(record.scope?.includes('management') ||
              record.scope?.includes('*')) && (
              <AutoTooltip ghost>
                {intl.formatMessage({ id: 'apikeys.accessScope.management' })}
              </AutoTooltip>
            )}
            {(record.scope?.includes('inference') ||
              record.scope?.includes('*')) && (
              <ThemeTag>
                <AutoTooltip ghost>
                  {record.allowed_model_names?.length
                    ? record.allowed_model_names.join(', ')
                    : intl.formatMessage({ id: 'apikeys.models.all' })}
                </AutoTooltip>
              </ThemeTag>
            )}
          </div>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.description' }),
        dataIndex: 'description',
        key: 'description',
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.creator' }),
        dataIndex: 'user_name',
        key: 'user_name',
        hidden: !showCreator,
        render: (text: string) => (
          <AutoTooltip ghost style={{ maxWidth: 200 }}>
            {text || '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: tableSorter(3),
        ellipsis: {
          showTitle: false
        },
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
        render: (text, record) => (
          <DropdownButtons
            items={actionList as MenuProps['items']}
            onSelect={(val, item) =>
              handleSelect(val, record, item as APIKeyAction)
            }
          />
        )
      }
    ];
  }, [intl, showCreator, handleSelect, actionList, pluginCols]);
};

export default useModelsColumns;
