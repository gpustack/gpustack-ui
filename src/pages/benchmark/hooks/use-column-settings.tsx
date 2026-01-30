import ColumnSettings from '@/pages/_components/column-settings';
import { useIntl } from '@umijs/max';
import React from 'react';

const useColumnSettings = (options: { contentHeight: number }) => {
  const intl = useIntl();
  const { contentHeight } = options;
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([]);

  const handleOnChange = (columns: string[]) => {
    setSelectedColumns(columns);
    console.log('selected columns:', columns);
  };

  const resultColumns = [
    {
      title: intl.formatMessage({ id: 'benchmark.table.rps' }),
      dataIndex: 'requests_per_second_mean'
    },
    {
      title: 'Throughput',
      dataIndex: 'throughput_mean'
    },
    {
      title: 'Throughput request',
      dataIndex: 'throughput_request_mean'
    },
    {
      title: 'Generated Tokens',
      dataIndex: 'generated_tokens_mean'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.tps' }),
      dataIndex: 'tokens_per_second_mean'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.itl' }),
      dataIndex: 'inter_token_latency_mean'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.tpot' }),
      dataIndex: 'time_per_output_token_mean'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.ttft' }),
      dataIndex: 'time_to_first_token_mean'
    },
    {
      title: 'Latency Avg',
      dataIndex: 'latency_mean'
    }
  ];

  const metadataColumns = [
    {
      title: intl.formatMessage({ id: 'clusters.title' }),
      dataIndex: 'cluster_id'
    },
    {
      title: intl.formatMessage({ id: 'resources.worker' }),
      dataIndex: 'worker_id'
    },
    {
      title: intl.formatMessage({ id: 'common.table.name' }),
      dataIndex: 'name'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.model' }),
      dataIndex: 'model_name'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.dataset' }),
      dataIndex: 'dataset_name'
    },
    {
      title: intl.formatMessage({ id: 'common.table.status' }),
      dataIndex: 'state'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.requestRate' }),
      dataIndex: 'request_rate'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.gpu' }),
      dataIndex: 'gpu_summary'
    },
    {
      title: intl.formatMessage({ id: 'common.table.createTime' }),
      dataIndex: 'created_at'
    },
    {
      title: intl.formatMessage({ id: 'common.table.operation' }),
      dataIndex: 'operations'
    }
  ];

  const SettingsButton = (
    <ColumnSettings
      contentHeight={contentHeight}
      selectedColumns={selectedColumns}
      onChange={handleOnChange}
      grouped={true}
      columns={[
        {
          title: 'Benchmark Results',
          children: resultColumns
        },
        {
          title: 'Metadata',
          children: metadataColumns
        }
      ]}
    ></ColumnSettings>
  );

  return {
    SettingsButton,
    selectedColumns
  };
};

export default useColumnSettings;
