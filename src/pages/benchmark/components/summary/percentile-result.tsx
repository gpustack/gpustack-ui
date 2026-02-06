import { useIntl } from '@umijs/max';
import { Table } from 'antd';
import { round } from 'lodash';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';

const PERCENTILES = [
  { key: 'p50', label: '50%' },
  { key: 'p90', label: '90%' },
  { key: 'p99', label: '99%' }
] as const;

const PercentileResult: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const metrics = detailData?.raw_metrics?.benchmarks?.[0]?.metrics || {};

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
      title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.latency' })} (ms)`,
      dataIndex: 'request_latency',
      render: (value: number) => round(value, 2)
    },
    {
      title: intl.formatMessage({
        id: 'benchmark.detail.percentile.inputTokens'
      }),
      dataIndex: 'prompt_token_count',
      render: (value: number) => round(value, 0)
    },
    {
      title: intl.formatMessage({
        id: 'benchmark.detail.percentile.outputTokens'
      }),
      dataIndex: 'output_token_count',
      render: (value: number) => round(value, 0)
    },
    {
      title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.input' })} (Tokens/s)`,
      dataIndex: 'prompt_tokens_per_second',
      render: (value: number) => round(value, 2)
    },
    {
      title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.output' })} (Tokens/s)`,
      dataIndex: 'output_tokens_per_second',
      render: (value: number) => round(value, 2)
    },
    {
      title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.total' })} (Tokens/s)`,
      dataIndex: 'tokens_per_second',
      render: (value: number) => round(value, 2)
    }
  ];

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
      <Table
        size="small"
        columns={[
          {
            title: (
              <span style={{ fontWeight: 500 }}>
                {intl.formatMessage({
                  id: 'benchmark.detail.percentile.title'
                })}
              </span>
            ),
            dataIndex: 'percentile',
            render: (value: string) => (
              <span style={{ fontWeight: 500 }}>{value}</span>
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
