import { AntdResponsiveTable as Table } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { round } from 'lodash';
import React, { useMemo } from 'react';
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

  const metricColumns = useMemo(
    () => [
      {
        title: 'TTFT (ms)',
        dataIndex: 'time_to_first_token_ms',
        key: 'time_to_first_token_ms',
        mobileTitle: 'TTFT (ms)',
        render: (value: number) => round(value, 2)
      },
      {
        title: 'ITL (ms)',
        dataIndex: 'inter_token_latency_ms',
        key: 'inter_token_latency_ms',
        mobileTitle: 'ITL (ms)',
        render: (value: number) => round(value, 2)
      },
      {
        title: 'TPOT (ms)',
        dataIndex: 'time_per_output_token_ms',
        key: 'time_per_output_token_ms',
        mobileTitle: 'TPOT (ms)',
        render: (value: number) => round(value, 2)
      },
      {
        title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.latency' })} (s)`,
        dataIndex: 'request_latency',
        key: 'request_latency',
        mobileTitle: `${intl.formatMessage({ id: 'benchmark.detail.percentile.latency' })} (s)`,
        render: (value: number) => round(value, 2)
      },
      {
        title: intl.formatMessage({
          id: 'benchmark.detail.percentile.inputTokens'
        }),
        dataIndex: 'prompt_token_count',
        key: 'prompt_token_count',
        mobileTitle: intl.formatMessage({
          id: 'benchmark.detail.percentile.inputTokens'
        }),
        render: (value: number) => round(value, 0)
      },
      {
        title: intl.formatMessage({
          id: 'benchmark.detail.percentile.outputTokens'
        }),
        dataIndex: 'output_token_count',
        key: 'output_token_count',
        mobileTitle: intl.formatMessage({
          id: 'benchmark.detail.percentile.outputTokens'
        }),
        render: (value: number) => round(value, 0)
      },
      {
        title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.input' })} (Tokens/s)`,
        dataIndex: 'prompt_tokens_per_second',
        key: 'prompt_tokens_per_second',
        mobileTitle: `${intl.formatMessage({ id: 'benchmark.detail.percentile.input' })} (Tokens/s)`,
        render: (value: number) => round(value, 2)
      },
      {
        title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.output' })} (Tokens/s)`,
        dataIndex: 'output_tokens_per_second',
        key: 'output_tokens_per_second',
        mobileTitle: `${intl.formatMessage({ id: 'benchmark.detail.percentile.output' })} (Tokens/s)`,
        render: (value: number) => round(value, 2)
      },
      {
        title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.total' })} (Tokens/s)`,
        dataIndex: 'tokens_per_second',
        key: 'tokens_per_second',
        mobileTitle: `${intl.formatMessage({ id: 'benchmark.detail.percentile.total' })} (Tokens/s)`,
        render: (value: number) => round(value, 2)
      }
    ],
    [intl]
  );

  const buildPercentileTable = (metricsData: any) => {
    return PERCENTILES.map(({ key, label }) => {
      const row: any = { percentile: label };

      metricColumns.forEach(({ dataIndex }) => {
        row[dataIndex] =
          metricsData?.[dataIndex]?.successful?.percentiles?.[key] ?? 0;
      });

      return row;
    });
  };

  const tableColumns = useMemo(
    () => [
      {
        title: (
          <span style={{ fontWeight: 500 }}>
            {intl.formatMessage({
              id: 'benchmark.detail.percentile.title'
            })}
          </span>
        ),
        dataIndex: 'percentile',
        key: 'percentile',
        mobileCard: 'primary' as const,
        render: (value: string) => (
          <span style={{ fontWeight: 500 }}>{value}</span>
        )
      },
      ...metricColumns
    ],
    [intl, metricColumns]
  );

  return (
    <div>
      <Table
        size="small"
        columns={tableColumns}
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
      />
    </div>
  );
};

export default PercentileResult;
