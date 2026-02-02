import AutoTooltip from '@/components/auto-tooltip';
import StatusTag from '@/components/status-tag';
import { tableSorter } from '@/config/settings';
import ColumnSettings from '@/pages/_components/column-settings';
import { useIntl } from '@umijs/max';
import { Progress } from 'antd';
import dayjs from 'dayjs';
import _, { round } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { BenchmarkStatus, BenchmarkStatusLabelMap } from '../config';
import { BenchmarkListItem as ListItem } from '../config/types';

const SubTitleWrapper = styled.span.attrs({
  className: 'sub-title'
})`
  display: list-item;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const defaultColumns: string[] = [
  'model_name',
  'dataset_name',
  'state',
  'gpu_summary',
  'tokens_per_second_mean',
  'time_to_first_token_mean',
  'time_per_output_token_mean'
];
const fixedColumns: string[] = [];

const useColumnSettings = (options: {
  contentHeight: number;
  clusterList: Global.BaseOption<number>[];
}) => {
  const intl = useIntl();
  const { contentHeight, clusterList } = options;
  const [selectedColumns, setSelectedColumns] =
    React.useState<string[]>(defaultColumns);

  const renderTitle = (
    title: React.ReactNode,
    options?: { subTitle?: React.ReactNode }
  ): React.ReactNode => {
    return (
      <span>
        <AutoTooltip
          ghost
          minWidth={20}
          title={`${title} ${options?.subTitle || ''}`}
        >
          {title}
        </AutoTooltip>
        {options?.subTitle && (
          <SubTitleWrapper>{options.subTitle}</SubTitleWrapper>
        )}
      </span>
    );
  };

  const resultColumns = [
    {
      title: renderTitle(
        `${intl.formatMessage({ id: 'benchmark.detail.summary.latency' })}`,
        {
          subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
        }
      ),
      pos: 11,
      dataIndex: 'request_latency_mean',
      path: 'request_latency_mean',
      unit: 'ms',
      sorter: tableSorter(1),
      render: (value: number) => round(value, 2)
    },
    {
      title: 'TPS',
      pos: 12,
      dataIndex: 'tokens_per_second_mean',
      path: 'tokens_per_second_mean',
      unit: 'Tokens/s',
      sorter: tableSorter(1),
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 2)}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle('TTFT', {
        subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
      }),
      pos: 13,
      sorter: tableSorter(1),
      dataIndex: 'time_to_first_token_mean',
      path: 'time_to_first_token_mean',
      unit: 'ms',
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 2)}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle('TPOT', {
        subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
      }),
      pos: 14,
      sorter: tableSorter(1),
      dataIndex: 'time_per_output_token_mean',
      path: 'time_per_output_token_mean',
      unit: 'ms',
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 2)}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle('ITL', {
        subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
      }),
      pos: 15,
      sorter: tableSorter(1),
      dataIndex: 'inter_token_latency_mean',
      path: 'inter_token_latency_mean',
      unit: 'ms',
      render: (value: number) => round(value, 2)
    },
    {
      title: 'RPS',
      pos: 16,
      dataIndex: 'requests_per_second_mean',
      sorter: tableSorter(1),
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 0)}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(
        `${intl.formatMessage({
          id: 'benchmark.detail.throughput.inputToken'
        })}`,
        {
          subTitle: '(Tokens/s)'
        }
      ),
      pos: 17,
      dataIndex: 'input_tokens_per_second_mean',
      path: 'input_tokens_per_second_mean',
      unit: 'Tokens/s',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2)}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(
        `${intl.formatMessage({
          id: 'benchmark.detail.throughput.outputToken'
        })}`,
        {
          subTitle: '(Tokens/s)'
        }
      ),
      pos: 18,
      dataIndex: 'output_tokens_per_second_mean',
      path: 'output_tokens_per_second_mean',
      unit: 'Tokens/s',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2)}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.total' })
      ),
      pos: 19,
      key: 'total_requests',
      dataIndex: 'total_requests',
      path: 'total_requests',
      precision: 0,
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.success' })
      ),
      pos: 20,
      key: 'total_requests',
      dataIndex: 'successful_requests',
      path: ['raw_metrics', 'benchmarks', '0'],
      render: (value: number) =>
        round(_.get(value, ['metrics', 'request_totals', 'successful']), 0) ||
        0,
      precision: 0,
      color: 'var(--ant-color-success)',
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.failed' })
      ),
      pos: 21,
      key: 'total_requests',
      dataIndex: 'failed_requests',
      path: ['raw_metrics', 'benchmarks', '0'],
      render: (value: number) =>
        round(_.get(value, ['metrics', 'request_totals', 'errored']), 0) || 0,
      precision: 0,
      color: 'var(--ant-color-error)',
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({
          id: 'benchmark.detail.requests.concurrency'
        })
      ),
      pos: 22,
      key: 'request_concurrency',
      dataIndex: 'request_concurrency',
      path: ['raw_metrics', 'benchmarks', '0'],
      render: (value: number) =>
        round(_.get(value, 'metrics.request_concurrency.successful.mean'), 0) ||
        0,
      precision: 0,
      unit: ''
    }
  ];

  const metadataColumns = [
    {
      title: renderTitle(intl.formatMessage({ id: 'clusters.title' })),
      pos: 1,
      dataIndex: 'cluster_id',
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {clusterList?.find((item) => item.value === text)?.label || text}
        </AutoTooltip>
      )
    },
    // {
    //   title: renderTitle(intl.formatMessage({ id: 'resources.worker' })),
    //   pos: 2,
    //   dataIndex: 'worker_id',
    //   render: (text: string) => (
    //     <AutoTooltip ghost minWidth={20}>
    //       {text}
    //     </AutoTooltip>
    //   )
    // },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.modelName' })
      ),
      pos: 3,
      dataIndex: 'model_name',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'benchmark.table.dataset' })),
      pos: 4,
      dataIndex: 'dataset_name',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'benchmark.form.profile' })),
      pos: 5,
      dataIndex: 'profile',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'benchmark.table.gpu' })),
      pos: 6,
      dataIndex: 'gpu_summary',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'common.table.status' })),
      pos: 7,
      width: 120,
      dataIndex: 'state',
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
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.table.requestRate' })
      ),
      pos: 8,
      dataIndex: 'request_rate',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'common.table.createTime' })),
      pos: 23,
      dataIndex: 'created_at',
      sorter: tableSorter(6),
      render: (value: string) => (
        <AutoTooltip ghost minWidth={20}>
          {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
        </AutoTooltip>
      )
    }
  ];

  const handleOnChange = (columns: string[]) => {
    setSelectedColumns(columns);
    console.log('selected columns:', columns);
  };

  const handleOnReset = () => {
    setSelectedColumns(defaultColumns);
  };

  const columns = React.useMemo(() => {
    const allColumns = [...metadataColumns, ...resultColumns];
    const selected = allColumns.filter((col) =>
      selectedColumns.includes(col.dataIndex as string)
    );
    // Sort by pos
    selected.sort((a, b) => (a.pos || 0) - (b.pos || 0));
    return selected;
  }, [selectedColumns, clusterList]);

  const SettingsButton = (
    <ColumnSettings
      tableName="benchmark"
      contentHeight={contentHeight}
      defaultSelectedColumns={selectedColumns}
      selectedColumns={selectedColumns}
      onChange={handleOnChange}
      onReset={handleOnReset}
      fixedColumns={fixedColumns}
      grouped={true}
      columns={[
        {
          title: intl.formatMessage({ id: 'benchmark.detail.summary.results' }),
          children: resultColumns
        },
        {
          title: intl.formatMessage({
            id: 'benchmark.detail.summary.metadata'
          }),
          children: metadataColumns
        }
      ]}
    ></ColumnSettings>
  );

  return {
    SettingsButton,
    columns
  };
};

export default useColumnSettings;
