// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import StatusTag from '@/components/status-tag';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import { Progress, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import _ from 'lodash';
import { useMemo } from 'react';
import RowActions from '../components/row-actions';
import { BenchmarkStatus, BenchmarkStatusLabelMap } from '../config';
import { BenchmarkListItem as ListItem } from '../config/types';

const useBenchmarkColumns = (
  sortOrder: string[],
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
        render: (text: string, record) => (
          <AutoTooltip ghost minWidth={20}>
            <Typography.Link onClick={() => onCellClick?.(record, 'name')}>
              {text}
            </Typography.Link>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.model' }),
        dataIndex: 'model_name',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.dataset' }),
        dataIndex: 'dataset_name',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        ellipsis: {
          showTitle: false
        },
        width: 120,
        render: (value: number, record: ListItem) => (
          <span className="flex-center gap-8">
            <StatusTag
              statusValue={{
                status: BenchmarkStatus[value],
                text: BenchmarkStatusLabelMap[value],
                message: record.state_message || undefined
              }}
            />
            {record.progress !== undefined && record.progress < 100 && (
              <Progress
                type="circle"
                percent={_.round(record.progress, 0)}
                size={20}
              />
            )}
          </span>
        )
      },
      // {
      //   title: intl.formatMessage({ id: 'benchmark.table.requestRate' }),
      //   dataIndex: 'request_rate',
      //   sorter: tableSorter(1),
      //   render: (text: string) => (
      //     <AutoTooltip ghost minWidth={20}>
      //       {text}
      //     </AutoTooltip>
      //   )
      // },
      {
        title: intl.formatMessage({ id: 'benchmark.table.gpu' }),
        dataIndex: 'gpu_summary',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: (
          <span className="flex-column">
            <span>{intl.formatMessage({ id: 'benchmark.table.itl' })}</span>
            <span>Avg (ms)</span>
          </span>
        ),
        dataIndex: 'inter_token_latency_mean',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {_.round(text, 1)}
          </AutoTooltip>
        )
      },
      {
        title: (
          <span className="flex-column">
            <span>{intl.formatMessage({ id: 'benchmark.table.tpot' })}</span>
            <span>Avg (ms)</span>
          </span>
        ),
        dataIndex: 'time_per_output_token_mean',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {_.round(text, 2)}
          </AutoTooltip>
        )
      },
      {
        title: (
          <span className="flex-column">
            <span>{intl.formatMessage({ id: 'benchmark.table.ttft' })}</span>
            <span>Avg (ms)</span>
          </span>
        ),
        dataIndex: 'time_to_first_token_mean',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {_.round(text, 2)}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.rps' }),
        dataIndex: 'requests_per_second_mean',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {_.round(text, 0)}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.tps' }),
        dataIndex: 'tokens_per_second_mean',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {_.round(text, 2)}
          </AutoTooltip>
        )
      },
      // {
      //   title: intl.formatMessage({ id: 'common.table.createTime' }),
      //   dataIndex: 'created_at',
      //   sorter: tableSorter(3),
      //   render: (value: string) => (
      //     <AutoTooltip ghost>
      //       {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
      //     </AutoTooltip>
      //   )
      // },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operations',
        ellipsis: {
          showTitle: false
        },
        render: (value: string, record: ListItem) => (
          <RowActions record={record} handleSelect={handleSelect}></RowActions>
        )
      }
    ];
  }, [intl, onCellClick, handleSelect]);
};

export default useBenchmarkColumns;
