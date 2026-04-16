// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import icons from '@/components/icon-font/icons';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ListItem } from '../config/types';

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
}

const actionList: Global.ActionItem<string>[] = [
  {
    label: 'common.button.edit',
    key: 'edit',
    icon: icons.EditOutlined
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    icon: icons.DeleteOutlined,
    props: { danger: true }
  }
];

const useModelsColumns = ({
  handleSelect,
  sortOrder
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        sorter: tableSorter(1),
        render: (text: string, record: ListItem) => (
          <span className="flex items-center">
            <AutoTooltip ghost style={{ maxWidth: 400 }}>
              <span className="text-primary">{text}</span>
            </AutoTooltip>
            {record.is_custom && (
              <Tag
                style={{
                  marginLeft: 8,
                  borderRadius: 12,
                  color: 'var(--ant-color-text-tertiary)',
                  borderColor: 'var(--ant-color-split)',
                  backgroundColor: 'transparent'
                }}
                variant="outlined"
              >
                {intl.formatMessage({ id: 'playground.params.custom' })}
              </Tag>
            )}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'apikeys.table.key' }),
        dataIndex: 'masked_value',
        key: 'masked_value',
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost style={{ maxWidth: 400 }}>
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
            {record.scope?.includes('management') && (
              <AutoTooltip ghost>
                {intl.formatMessage({ id: 'apikeys.accessScope.management' })}
              </AutoTooltip>
            )}
            {record.scope?.includes('inference') && (
              <div
                style={{
                  border: '1px solid var(--ant-color-split)',
                  color: 'var(--ant-color-text-tertiary)',
                  backgroundColor: 'var(--ant-color-fill-quaternary)',
                  borderRadius: 4,
                  paddingInline: 8,
                  flexGrow: 0,
                  maxWidth: '100%',
                  width: 'max-content',
                  display: 'flex'
                }}
              >
                <AutoTooltip ghost>
                  {record.allowed_model_names?.length
                    ? record.allowed_model_names.join(', ')
                    : intl.formatMessage({ id: 'apikeys.models.all' })}
                </AutoTooltip>
              </div>
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
            items={actionList}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [intl, handleSelect]);
};

export default useModelsColumns;
