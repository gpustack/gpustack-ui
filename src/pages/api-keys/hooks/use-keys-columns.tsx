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
import { accessScopeOptions } from '../config';
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

  const renderAPIs = (record: ListItem) => {
    const option = accessScopeOptions.find(
      (item) => item.value === record.scope?.[0]
    );
    return (
      <span className="flex-center gap-4">
        {intl.formatMessage({
          id: option?.label || ''
        })}
        {option?.description && <span>[{option?.description}]</span>}
      </span>
    );
  };

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
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'apikeys.table.key' }),
        dataIndex: 'masked_value',
        key: 'masked_value',
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost style={{ maxWidth: 400 }}>
            {text}
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr',
              gap: 8,
              alignItems: 'center'
            }}
          >
            <span className="text-primary">APIs:</span>
            <AutoTooltip ghost>{renderAPIs(record)}</AutoTooltip>
            <span className="text-primary">
              {intl.formatMessage({ id: 'models.title' })}:
            </span>
            <AutoTooltip ghost>
              <span>
                {text?.length
                  ? text?.join(', ')
                  : intl.formatMessage({ id: 'common.select.option' })}
              </span>
            </AutoTooltip>
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
