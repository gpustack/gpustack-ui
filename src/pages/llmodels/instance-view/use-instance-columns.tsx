// columns.ts
import DropdownButtons from '@/components/drop-down-buttons';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import { ColumnsType } from 'antd/lib/table';
import { useMemo } from 'react';
import { ModelInstanceListItem as ListItem } from '../config/types';

const useProviderColumns = (
  handleSelect: (val: string, record: ListItem) => void,
  onCellClick?: (record: ListItem, dataIndex: string) => void
): ColumnsType<ListItem> => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        minWidth: 160,
        span: 5,
        render: () => '--'
      },
      {
        title: intl.formatMessage({ id: 'providers.table.providerName' }),
        dataIndex: ['config', 'type'],
        sorter: tableSorter(2),
        span: 4,
        minWidth: 160,
        render: () => '--'
      },
      {
        title: intl.formatMessage({ id: 'providers.table.models' }),
        dataIndex: 'models',
        span: 3,
        minWidth: 200,
        render: () => '--'
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(6),
        span: 3,
        render: () => '--'
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operations',
        span: 3,
        minWidth: 120,
        render: (value: string, record: ListItem) => (
          <DropdownButtons
            items={[]}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [handleSelect, onCellClick]);
};

export default useProviderColumns;
