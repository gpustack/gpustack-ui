import { useIntl } from '@umijs/max';
import { Table, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { round } from 'lodash';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';
import { LOW_SAMPLE_THRESHOLD, tailSamples } from './metrics';

// The table sits in its own bordered box inside the Stage detail card: it is a
// secondary read, and a tinted header keeps it from competing with the metric
// columns above.
const useStyles = createStyles(({ css }) => ({
  box: css`
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: var(--ant-border-radius);
    overflow: hidden;
    .ant-table-thead > tr > th {
      background: var(--ant-color-fill-quaternary) !important;
      border-bottom: 1px solid var(--ant-color-border-secondary);
      color: var(--ant-color-text-secondary);
      font-weight: 600;
      font-size: 12px;
      height: 40px;
    }
    .ant-table-thead > tr > th::before {
      display: none !important;
    }
    .ant-table-tbody > tr > td {
      height: 42px;
      font-variant-numeric: tabular-nums;
      border-bottom: 1px solid var(--ant-color-fill-quaternary);
    }
    .ant-table-tbody > tr:last-child > td {
      border-bottom: none;
    }
  `
}));

const PERCENTILES = [
  { key: 'p50', label: '50%' },
  { key: 'p90', label: '90%' },
  { key: 'p99', label: '99%' }
] as const;

const PercentileResult: React.FC<{ data?: any }> = (props) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const { detailData } = useDetailContext();
  // Feed the selected stage's data when provided (Overview drill-down).
  const data = props.data ?? detailData;
  const metrics = data?.raw_metrics?.benchmarks?.[0]?.metrics || {};
  // Below ~100 samples the tail percentiles collapse onto max (p999 == p99 ==
  // max), so a single outlier would be read as an SLA conclusion. Say so instead
  // of presenting the number bare.
  const sampleCount: number =
    metrics?.time_to_first_token_ms?.successful?.count ??
    metrics?.request_totals?.successful ??
    0;
  const lowSample = sampleCount > 0 && sampleCount < LOW_SAMPLE_THRESHOLD;

  const columns = [
    {
      title: 'TTFT (ms)',
      dataIndex: 'time_to_first_token_ms',
      render: (value: number) => round(value, 2)
    },
    {
      // Decode-only TPOT, which guidellm files under `inter_token_latency_ms`.
      // `fallbackIndex` is its includes-TTFT metric, used only when the response
      // was not streamed incrementally and the decode-only reading collapsed to 0
      // — the same rule as metrics.ts `decodeMs` and the server's SLA fallback.
      title: (
        <Tooltip
          title={intl.formatMessage({ id: 'benchmark.detail.tpot.tip' })}
        >
          <span style={{ borderBottom: '1px dashed currentColor' }}>
            TPOT (ms)
          </span>
        </Tooltip>
      ),
      dataIndex: 'inter_token_latency_ms',
      fallbackIndex: 'time_per_output_token_ms',
      render: (value: number) => round(value, 2)
    },
    {
      title: `${intl.formatMessage({ id: 'benchmark.detail.percentile.latency' })} (s)`,
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
    }
    // No TPS / In TPS / Out TPS percentile columns, on purpose. guidellm derives
    // its token-rate distributions from RECONSTRUCTED timings: it keeps only the
    // first and last token timestamp per request and spreads the tokens evenly
    // between them (np.linspace in GenerativeRequestStats.iter_tokens_timings),
    // while the whole prompt is dropped in at the first-token instant. The
    // duration-weighted mean survives that — it is still total tokens over the
    // event span, and the Throughput card shows it — but the quantiles are
    // artifacts of the interpolation: a real 480-request stage reported
    // tokens_per_second p99 = 689,483 tok/s and max = 9.6M tok/s.
  ];

  const buildPercentileTable = (metrics: any) => {
    return PERCENTILES.map(({ key, label }) => {
      const row: any = { percentile: label };
      const quantile = (field?: string) =>
        field ? metrics?.[field]?.successful?.percentiles?.[key] : undefined;

      columns.forEach((c) => {
        const v = quantile(c.dataIndex);
        // A non-positive per-token latency means "not measured", so the fallback
        // metric takes over — see the TPOT column above.
        row[c.dataIndex] =
          (typeof v === 'number' && v > 0 ? v : undefined) ??
          quantile((c as { fallbackIndex?: string }).fallbackIndex) ??
          v ??
          0;
      });

      return row;
    });
  };

  return (
    <div>
      <div className={styles.box}>
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
        ></Table>
      </div>
      {lowSample && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: 'var(--ant-color-text-tertiary)'
          }}
        >
          {intl.formatMessage(
            { id: 'benchmark.detail.lowSample' },
            { count: sampleCount, tail: tailSamples(sampleCount) }
          )}
        </div>
      )}
    </div>
  );
};

export default PercentileResult;
