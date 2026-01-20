// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import icons from '@/components/icon-font/icons';
import { tableSorter } from '@/config/settings';
import { useIntl, useModel } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Tag } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ListItem } from '../config/types';

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

  const setActions = useMemoizedFn((record: ListItem) => {
    return actionList.filter((action) => {
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
            {text}
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
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [sortOrder, intl, handleSelect, setActions]);
};

export default useUsersColumns;
