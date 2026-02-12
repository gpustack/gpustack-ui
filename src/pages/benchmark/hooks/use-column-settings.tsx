import AutoTooltip from '@/components/auto-tooltip';
import InfoColumn from '@/components/simple-table/info-column';
import StatusTag from '@/components/status-tag';
import { tableSorter } from '@/config/settings';
import ColumnSettings from '@/pages/_components/column-settings';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import dayjs from 'dayjs';
import _, { round } from 'lodash';
import React from 'react';
import {
  BenchmarkStatus,
  BenchmarkStatusLabelMap,
  BenchmarkStatusValueMap
} from '../config';
import { BenchmarkListItem as ListItem } from '../config/types';

// sort by this order
const allFields = [
  'cluster_id',
  'model_name',
  'profile',
  'dataset_name',
  'gpu_summary',
  'state',
  'request_rate',
  'request_latency_mean',
  'tokens_per_second_mean',
  'time_to_first_token_mean',
  'time_per_output_token_mean',
  'inter_token_latency_mean',
  'requests_per_second_mean',
  'input_tokens_per_second_mean',
  'output_tokens_per_second_mean',
  'total_requests',
  'request_successful',
  'request_errored',
  'request_incomplete',
  'request_concurrency_mean',
  'request_concurrency_max',
  'created_at'
];

const fieldSortPos: Record<string, number> = Object.fromEntries(
  allFields.map((field, index) => [field, index + 1])
);

const defaultColumns: string[] = [
  'model_name',
  'profile',
  'state',
  'gpu_summary',
  'tokens_per_second_mean',
  'time_to_first_token_mean',
  'time_per_output_token_mean'
];
const fixedColumns: string[] = [];

const BenchmarkStateTag = (props: { data: ListItem }) => {
  const { data } = props;
  if (!data.state) {
    return null;
  }
  return (
    <StatusTag
      download={
        data.state === BenchmarkStatusValueMap.Running
          ? { percent: data.progress || 0 }
          : undefined
      }
      statusValue={{
        status:
          data.state === BenchmarkStatusValueMap.Running &&
          data.progress === 100
            ? BenchmarkStatus[BenchmarkStatusValueMap.Completed]
            : BenchmarkStatus[data.state],
        text: BenchmarkStatusLabelMap[data.state],
        message:
          data.state === BenchmarkStatusValueMap.Running &&
          data.progress === 100
            ? ''
            : data.state_message
      }}
    />
  );
};

const useColumnSettings = (options: {
  contentHeight: number;
  profileOptions: Global.BaseOption<string>[];
  clusterList: Global.BaseOption<number>[];
}) => {
  const intl = useIntl();
  const { contentHeight, clusterList, profileOptions } = options;
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
          <span className="sub-title">
            <AutoTooltip
              ghost
              minWidth={20}
              title={`${title} ${options?.subTitle || ''}`}
            >
              {options.subTitle}
            </AutoTooltip>
          </span>
        )}
      </span>
    );
  };

  const fieldList = [
    {
      label: 'benchmark.detail.throughput.inputToken',
      key: 'input_tokens_per_second_mean',
      locale: true,
      render: (val: any) => round(val, 2)
    },
    {
      label: 'benchmark.detail.throughput.outputToken',
      key: 'output_tokens_per_second_mean',
      locale: true,
      render: (val: any) => round(val, 2)
    }
  ];

  const resultColumns = [
    {
      title: renderTitle(
        `${intl.formatMessage({ id: 'benchmark.detail.summary.latency' })}`,
        {
          subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
        }
      ),
      dataIndex: 'request_latency_mean',
      path: 'request_latency_mean',
      unit: 'ms',
      sorter: tableSorter(1),
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2)}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle('TTFT', {
        subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
      }),
      sorter: tableSorter(1),
      dataIndex: 'time_to_first_token_mean',
      path: 'time_to_first_token_mean',
      unit: 'ms',
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 2) || '-'}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle('TPOT', {
        subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
      }),
      sorter: tableSorter(1),
      dataIndex: 'time_per_output_token_mean',
      path: 'time_per_output_token_mean',
      unit: 'ms',
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 2) || '-'}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle('ITL', {
        subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
      }),
      sorter: tableSorter(1),
      dataIndex: 'inter_token_latency_mean',
      path: 'inter_token_latency_mean',
      unit: 'ms',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2) || '-'}
        </AutoTooltip>
      )
    },
    {
      title: 'RPS',
      dataIndex: 'requests_per_second_mean',
      sorter: tableSorter(1),
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 2) || '-'}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(
        `${intl.formatMessage({ id: 'benchmark.detail.throughput.totalToken' })}`,
        {
          subTitle: '(Tokens/s)'
        }
      ),
      dataIndex: 'tokens_per_second_mean',
      path: 'tokens_per_second_mean',
      unit: 'Tokens/s',
      sorter: tableSorter(1),
      render: (text: number, record: any) => (
        <AutoTooltip
          ghost
          minWidth={20}
          maxWidth={'max-content'}
          showTitle={text > 0}
          title={<InfoColumn fieldList={fieldList} data={record}></InfoColumn>}
        >
          {_.round(text, 2) || '-'}
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
      dataIndex: 'input_tokens_per_second_mean',
      path: 'input_tokens_per_second_mean',
      unit: 'Tokens/s',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2) || 0}
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
      dataIndex: 'output_tokens_per_second_mean',
      path: 'output_tokens_per_second_mean',
      unit: 'Tokens/s',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2) || 0}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.total' })
      ),
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
      dataIndex: 'request_successful',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      color: 'var(--ant-color-success)',
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.failed' })
      ),
      dataIndex: 'request_errored',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      color: 'var(--ant-color-error)',
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.incomplete' })
      ),
      dataIndex: 'request_incomplete',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
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
      dataIndex: 'request_concurrency_mean',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({
          id: 'benchmark.detail.requests.concurrency.max'
        })
      ),
      dataIndex: 'request_concurrency_max',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      unit: ''
    }
  ];

  const metadataColumns = [
    {
      title: (
        <Typography.Text ellipsis={{ tooltip: true }}>
          {intl.formatMessage({ id: 'clusters.title' })}
        </Typography.Text>
      ),
      dataIndex: 'cluster_id',
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {clusterList?.find((item) => item.value === text)?.label || text}
        </AutoTooltip>
      )
    },
    {
      title: (
        <Typography.Text ellipsis={{ tooltip: true }}>
          {intl.formatMessage({ id: 'benchmark.detail.modelName' })}
        </Typography.Text>
      ),
      dataIndex: 'model_name',
      sorter: tableSorter(1),
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: (
        <Typography.Text ellipsis={{ tooltip: true }}>
          {intl.formatMessage({ id: 'benchmark.form.profile' })}
        </Typography.Text>
      ),
      dataIndex: 'profile',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {profileOptions.find((option) => option.value === text)?.label ||
            text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'benchmark.table.dataset' })),
      dataIndex: 'dataset_name',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'benchmark.table.gpu' })),
      dataIndex: 'gpu_summary',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'common.table.status' })),
      width: 120,
      dataIndex: 'state',
      render: (value: number, record: ListItem) => (
        <BenchmarkStateTag data={record} />
      )
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.table.requestRate' })
      ),
      dataIndex: 'request_rate',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'common.table.createTime' })),
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
    selected.sort(
      (a, b) =>
        (fieldSortPos[a.dataIndex] || 0) - (fieldSortPos[b.dataIndex] || 0)
    );
    return selected;
  }, [selectedColumns, clusterList, intl, profileOptions]);

  const SettingsButton = (
    <ColumnSettings
      tableName="benchmark"
      contentHeight={contentHeight}
      defaultSelectedColumns={defaultColumns}
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
