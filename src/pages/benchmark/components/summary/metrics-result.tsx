import { Descriptions } from 'antd';
import _, { round } from 'lodash';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';
import Section from './section';

const columns = [
  {
    title: 'Duration (s)',
    dataIndex: 'duration',
    path: ['raw_metrics', 'benchmarks', '0', 'duration'],
    unit: 's',
    render: (value: number) => round(value, 2)
  },

  {
    title: 'Total Requests',
    dataIndex: 'total_requests',
    path: 'total_requests',
    unit: '',
    render: (value: number) => round(value, 0)
  },
  {
    title: 'Total token throughput',
    dataIndex: 'tokens_per_second_mean',
    path: 'tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Success Requests',
    dataIndex: 'successful_requests',
    path: ['raw_metrics', 'benchmarks', '0'],
    unit: '',
    render: (value: number) => {
      return (
        <span style={{ color: 'var(--ant-color-success)' }}>
          {_.get(value, 'metrics.request_totals.successful')}
        </span>
      );
    }
  },

  {
    title: 'Output token throughput',
    dataIndex: 'output_tokens_per_second_mean',
    path: 'output_tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  }
];

const columnsSub = [
  {
    title: 'Failed Requests',
    dataIndex: 'failed_requests',
    path: ['raw_metrics', 'benchmarks', '0'],
    unit: '',
    render: (value: number) => {
      return (
        <span style={{ color: 'var(--ant-color-error)' }}>
          {_.get(value, 'metrics.request_totals.errored')}
        </span>
      );
    }
  },
  {
    title: 'Concurrency',
    dataIndex: 'request_concurrency',
    path: ['raw_metrics', 'benchmarks', '0'],
    unit: '',
    render: (value: number) => {
      return round(
        _.get(value, 'metrics.request_concurrency.successful.mean'),
        0
      );
    }
  },
  {
    title: 'Request token throughput ',
    dataIndex: 'prompt_tokens_per_second_mean',
    path: 'prompt_tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Average Request Latency (ms)',
    dataIndex: 'request_latency_mean',
    path: 'request_latency_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Average Time To First Token (ms)',
    dataIndex: 'time_to_first_token_mean',
    path: 'time_to_first_token_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Average Time Per Output Token (ms)',
    dataIndex: 'time_per_output_token_mean',
    path: 'time_per_output_token_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: '',
    dataIndex: '',
    path: '',
    unit: '',
    render: (_: number) => ''
  }
];

const PERCENTILES = [
  { key: 'metrics', label: 'Metrics', title: 'N/A' }
] as const;

const PercentileResult: React.FC = () => {
  const { detailData } = useDetailContext();
  const metrics = detailData?.raw_metrics?.benchmarks?.[0]?.metrics || {};

  const buildPercentileTable = (metrics: any) => {
    return PERCENTILES.map(({ key, title }) => {
      const row: any = { metrics: title };

      [...columns, ...columnsSub].forEach(({ dataIndex, path }) => {
        row[dataIndex] = _.get(detailData, path) ?? 0;
      });

      return row;
    });
  };

  const items = [...columns, ...columnsSub].map(
    ({ title, dataIndex, path, render, unit }) => ({
      key: dataIndex,
      label: title,
      children: unit ? (
        <span className="flex-center">
          {render(_.get(detailData, path) ?? 0)}{' '}
          <span className="m-l-4">({unit})</span>
        </span>
      ) : (
        render(_.get(detailData, path) ?? 0)
      )
    })
  );

  return (
    <Section title="Metrics Result" minHeight={210}>
      {/* <Table
        size="small"
        columns={[
          {
            title: 'Metrics',
            dataIndex: 'metrics'
          },
          ...columns
        ]}
        dataSource={buildPercentileTable(metrics)}
        rowKey="percentile"
        pagination={false}
        styles={{
          body: {
            cell: {
              height: 54
            }
          }
        }}
      ></Table> */}
      <Descriptions
        items={items}
        colon={false}
        column={2}
        styles={{
          content: {
            justifyContent: 'flex-end'
          }
        }}
      ></Descriptions>
    </Section>
  );
};

export default PercentileResult;
