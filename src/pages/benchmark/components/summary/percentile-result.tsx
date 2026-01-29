import { Table } from 'antd';
import { round } from 'lodash';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';
import Title from './title';

const columns = [
  {
    title: 'TTFT (ms)',
    dataIndex: 'time_to_first_token_ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'ITL (ms)',
    dataIndex: 'inter_token_latency_ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'TPOT (ms)',
    dataIndex: 'time_per_output_token_ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Latency (s)',
    dataIndex: 'request_latency',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Input tokens',
    dataIndex: 'prompt_token_count',
    render: (value: number) => round(value, 0)
  },
  {
    title: 'Output tokens',
    dataIndex: 'output_token_count',
    render: (value: number) => round(value, 0)
  },
  {
    title: 'Input (t/s)',
    dataIndex: 'prompt_tokens_per_second',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Output (t/s)',
    dataIndex: 'output_tokens_per_second',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Total (t/s)',
    dataIndex: 'tokens_per_second',
    render: (value: number) => round(value, 2)
  }
];

const PERCENTILES = [
  { key: 'p50', label: '50%' },
  { key: 'p90', label: '90%' },
  { key: 'p99', label: '99%' }
] as const;

const PercentileResult: React.FC = () => {
  const { detailData } = useDetailContext();
  const metrics = detailData?.raw_metrics?.benchmarks?.[0]?.metrics || {};

  const buildPercentileTable = (metrics: any) => {
    return PERCENTILES.map(({ key, label }) => {
      const row: any = { percentile: label };

      columns.forEach(({ dataIndex }) => {
        row[dataIndex] =
          metrics?.[dataIndex]?.successful?.percentiles?.[key] ?? 0;
      });

      return row;
    });
  };

  return (
    <div>
      <Title>Percentile</Title>
      <Table
        size="small"
        columns={[
          {
            title: 'Percentile',
            dataIndex: 'percentile',
            render: (value: string) => (
              <span style={{ fontWeight: 400 }}>{value}</span>
            )
          },
          ...columns
        ]}
        dataSource={buildPercentileTable(metrics)}
        rowKey="percentile"
        pagination={false}
        styles={{
          header: {
            row: {
              backgroundColor: 'transparent'
            },
            cell: {
              fontWeight: 400,
              height: 40,
              borderBottom: '1px solid var(--ant-color-split)'
            }
          },
          body: {
            cell: {
              height: 54
            }
          }
        }}
      ></Table>
    </div>
  );
};

export default PercentileResult;
