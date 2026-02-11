// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import RowActions from '../components/row-actions';
import { BenchmarkListItem as ListItem } from '../config/types';

const useBenchmarkColumns = (params: {
  sortOrder: string[];
  columns: ColumnsType<ListItem>;
  handleSelect: (val: string, record: ListItem) => void;
  onCellClick?: (record: ListItem, dataIndex: string) => void;
}): ColumnsType<ListItem> => {
  const intl = useIntl();
  const { onCellClick, handleSelect, columns } = params;

  return useMemo(() => {
    return [
      {
        title: (
          <AutoTooltip ghost minWidth={20}>
            {intl.formatMessage({ id: 'common.table.name' })}
          </AutoTooltip>
        ),
        dataIndex: 'name',
        sorter: tableSorter(1),
        render: (text: string, record) => (
          <AutoTooltip ghost minWidth={20}>
            <Typography.Link onClick={() => onCellClick?.(record, 'name')}>
              {text}
            </Typography.Link>
          </AutoTooltip>
        )
      },
      ...columns,
      {
        title: (
          <Typography.Text ellipsis={{ tooltip: true }}>
            {intl.formatMessage({ id: 'common.table.operation' })}
          </Typography.Text>
        ),
        dataIndex: 'operations',
        width: 140,
        render: (value: string, record: ListItem) => (
          <RowActions record={record} handleSelect={handleSelect}></RowActions>
        )
      }
    ];
  }, [intl, onCellClick, handleSelect, columns]);
};

export default useBenchmarkColumns;
