// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import { tableSorter } from '@/config/settings';
import { WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import RowActions from '../components/row-actions';
import { BenchmarkStatusValueMap } from '../config';
import { BenchmarkListItem as ListItem } from '../config/types';

const resultFields: string[] = [
  'request_latency_mean',
  'time_to_first_token_mean',
  'time_per_output_token_mean',
  'inter_token_latency_mean',
  'requests_per_second_mean',
  'tokens_per_second_mean',
  'input_tokens_per_second_mean',
  'output_tokens_per_second_mean',
  'request_successful',
  'request_concurrency_mean'
];

const useBenchmarkColumns = (params: {
  sortOrder: string[];
  columns: ColumnsType<ListItem>;
  handleSelect: (val: string, record: ListItem) => void;
  onCellClick?: (record: ListItem, dataIndex: string) => void;
}): ColumnsType<ListItem> => {
  const intl = useIntl();
  const { onCellClick, handleSelect, columns } = params;

  const isNoData = (record: Record<string, any>) => {
    const isComplete = record.state === BenchmarkStatusValueMap.Completed;
    return isComplete && resultFields.every((field: string) => !record[field]);
  };

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
          <span className="flex-center gap-4">
            <AutoTooltip ghost minWidth={20}>
              <Typography.Link onClick={() => onCellClick?.(record, 'name')}>
                {text}
              </Typography.Link>
            </AutoTooltip>
            {isNoData(record) && (
              <Tooltip
                title={intl.formatMessage({
                  id: 'benchmark.detail.result.unavailable'
                })}
              >
                <WarningOutlined
                  style={{ color: 'var(--ant-color-warning)' }}
                ></WarningOutlined>
              </Tooltip>
            )}
          </span>
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
