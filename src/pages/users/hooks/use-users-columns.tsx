// columns.ts
import { tableSorter } from '@/config/settings';
import { getGPUStackPlugin } from '@/plugins';
import {
  AutoTooltip,
  DropdownButtons,
  IconFont,
  icons
} from '@gpustack/core-ui';
import { useIntl, useModel } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Tag } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ListItem } from '../config/types';

// Plugin slot: an enterprise plugin can contribute additional entries
// to the user-row action dropdown via `users.rowActions`. Each entry
// owns its own click behaviour (the host just dispatches by key);
// register a single global drawer/modal under `components.
// UsersPageGlobal` to host any UI state the click needs to open.
//
// `placement` controls where the entry lands relative to the built-in
// items. Default: `before-danger` — appended after the safe entries
// and before the destructive ones (delete). `after-edit` slots the
// entry right after `Edit`, grouping "modify the user" actions
// together before any lifecycle ops.
type PluginRowAction = {
  key: string;
  labelId: string;
  icon?: React.ReactNode;
  danger?: boolean;
  placement?: 'after-edit' | 'before-danger';
  show?: (user: ListItem) => boolean;
  onClick: (user: ListItem) => void;
};
interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
}

const actionList: Global.ActionItem[] = [
  {
    label: 'common.button.edit',
    key: 'edit',
    icon: icons.EditOutlined
  },
  {
    label: 'users.status.activate',
    key: 'active',
    icon: icons.LockOpen
  },
  {
    label: 'users.status.deactivate',
    key: 'inactive',
    icon: icons.LockPerson
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    icon: icons.DeleteOutlined,
    props: { danger: true }
  }
];

const useUsersColumns = ({
  handleSelect,
  sortOrder
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();
  const { initialState } = useModel('@@initialState') || {};
  const pluginRowActions: PluginRowAction[] =
    getGPUStackPlugin()?.users?.rowActions ?? [];

  const setActions = useMemoizedFn((record: ListItem) => {
    const builtIn = actionList.filter((action) => {
      if (action.key === 'delete') {
        return initialState?.currentUser?.id !== record.id;
      }
      if (action.key === 'active') {
        return !record.is_active && initialState?.currentUser?.id !== record.id;
      }
      if (action.key === 'inactive') {
        return record.is_active && initialState?.currentUser?.id !== record.id;
      }
      return true;
    });
    const eligible = pluginRowActions.filter((a) =>
      a.show ? a.show(record) : true
    );
    const toItem = (a: PluginRowAction): Global.ActionItem<ListItem> => ({
      label: a.labelId,
      key: a.key,
      icon: a.icon,
      props: a.danger ? { danger: true } : undefined
    });
    const afterEdit = eligible
      .filter((a) => a.placement === 'after-edit')
      .map(toItem);
    const beforeDanger = eligible
      .filter((a) => (a.placement ?? 'before-danger') === 'before-danger')
      .map(toItem);

    // Splice in `after-edit` entries right after the `edit` built-in
    // so "modify the user" actions group together. Everything else
    // goes after the safe built-ins; danger built-ins (delete) stay
    // at the very bottom regardless of where plugin items landed.
    const editIdx = builtIn.findIndex((a) => a.key === 'edit');
    const withAfterEdit =
      editIdx >= 0
        ? [
            ...builtIn.slice(0, editIdx + 1),
            ...afterEdit,
            ...builtIn.slice(editIdx + 1)
          ]
        : [...afterEdit, ...builtIn];
    const merged = [...withAfterEdit, ...beforeDanger];
    const safe = merged.filter((a) => !a.props?.danger);
    const danger = merged.filter((a) => a.props?.danger);
    return [...safe, ...danger];
  });

  const onSelectAction = useMemoizedFn((val: string, record: ListItem) => {
    const fromPlugin = pluginRowActions.find((a) => a.key === val);
    if (fromPlugin) {
      fromPlugin.onClick(record);
      return;
    }
    handleSelect(val, record);
  });

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'username',
        key: 'username',
        sorter: tableSorter(1),
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost style={{ maxWidth: 400 }}>
            <span className="text-primary">{text}</span>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'users.table.role' }),
        dataIndex: 'is_admin',
        key: 'is_admin',
        sorter: tableSorter(6),
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => {
          return record.is_admin ? (
            <AutoTooltip ghost minWidth={50}>
              <IconFont type="icon-manage_user" className="size-16"></IconFont>
              <span className="m-l-5">
                {intl.formatMessage({ id: 'users.form.admin' })}
              </span>
            </AutoTooltip>
          ) : (
            <AutoTooltip ghost minWidth={50}>
              <IconFont type="icon-user" className="size-16"></IconFont>
              <span className="m-l-5">
                {intl.formatMessage({ id: 'users.form.user' })}
              </span>
            </AutoTooltip>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'users.form.fullname' }),
        dataIndex: 'full_name',
        key: 'full_name',
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'users.form.source' }),
        dataIndex: 'source',
        key: 'source',
        sorter: tableSorter(3),
        ellipsis: {
          showTitle: false
        },
        render: (text: string[], record: ListItem) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'users.table.status' }),
        dataIndex: 'is_active',
        key: 'is_active',
        sorter: tableSorter(4),
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => {
          return (
            <>
              {record.is_active ? (
                <Tag
                  style={{
                    marginRight: 0,
                    paddingInline: 12,
                    borderRadius: 12,
                    background: 'unset',
                    borderColor: 'var(--ant-color-success)'
                  }}
                  color="success"
                >
                  {intl.formatMessage({
                    id: 'users.status.active'
                  })}
                </Tag>
              ) : (
                <Tag
                  style={{
                    marginRight: 0,
                    paddingInline: 12,
                    borderRadius: 12,
                    background: 'unset',
                    color: 'var(--ant-color-text-description)'
                  }}
                  variant="outlined"
                  color="default"
                >
                  {intl.formatMessage({
                    id: 'users.status.inactive'
                  })}
                </Tag>
              )}
            </>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: tableSorter(5),
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
            items={setActions(record)}
            onSelect={(val) => onSelectAction(val, record)}
          />
        )
      }
    ];
  }, [sortOrder, intl, setActions, onSelectAction]);
};

export default useUsersColumns;
