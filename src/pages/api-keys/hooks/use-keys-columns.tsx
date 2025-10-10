// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import icons from '@/components/icon-font/icons';
import { useIntl } from '@umijs/max';
import type { SortOrder } from 'antd/es/table/interface';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ListItem } from '../config/types';

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: SortOrder;
}

const actionList: Global.ActionItem[] = [
  {
    label: 'Edit Allowed Models',
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
        title: intl.formatMessage({ id: 'apikeys.table.bindModels' }),
        dataIndex: 'allowed_model_names',
        key: 'allowed_model_names',
        ellipsis: {
          showTitle: false
        },
        render: (text: string[], record: ListItem) => (
          <AutoTooltip ghost>{text?.join(', ')}</AutoTooltip>
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
        defaultSortOrder: 'descend',
        sortOrder,
        sorter: false,
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
  }, [sortOrder, intl, handleSelect]);
};

export default useModelsColumns;
