import { useIntl } from '@umijs/max';
import { createStyles } from 'antd-style';
import _, { round } from 'lodash';
import React from 'react';
import { loadAxisLabelId, loadValueDecimals } from '../../config';
import { useDetailContext } from '../../config/detail-context';

// Grouped metric report (Basic / Throughput / Latency), each a label→value list.
// Three columns separated by hairlines — a card inside a card reads as two
// levels of nesting for one level of meaning. Values are right-aligned against a
// fixed unit column so the numbers form a readable stack.
const useStyles = createStyles(({ css }) => ({
  box: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    .group {
      padding: 0 26px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .group:first-child {
      padding-left: 0;
    }
    .group + .group {
      border-left: 1px solid var(--ant-color-border-secondary);
    }
    .group .g-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--ant-color-text-tertiary);
    }
    .metric {
      display: flex;
      align-items: baseline;
      gap: 12px;
      font-size: 13px;
    }
    .metric .m-label {
      flex: 1;
      min-width: 0;
      color: var(--ant-color-text-secondary);
    }
    .metric .m-value {
      font-variant-numeric: tabular-nums;
      text-align: right;
      white-space: nowrap;
    }
    .metric .m-unit {
      width: 42px;
      font-size: 11px;
      color: var(--ant-color-text-tertiary);
    }
    .metric .m-value .sub {
      font-size: 12px;
    }
  `
}));

interface MetricDef {
  title: string;
  path: string | string[];
  unit?: string;
  render: (value: any) => React.ReactNode;
}

const throughputColumns: MetricDef[] = [
  {
    title: 'benchmark.detail.throughput.totalToken',
    path: 'tokens_per_second_mean',
    unit: 'tok/s',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'benchmark.detail.throughput.inputToken',
    path: 'input_tokens_per_second_mean',
    unit: 'tok/s',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'benchmark.detail.throughput.outputToken',
    path: 'output_tokens_per_second_mean',
    unit: 'tok/s',
    render: (value: number) => round(value, 2)
  }
];

const latencyColumns: MetricDef[] = [
  {
    // request_latency is SECONDS everywhere (the schema, the backend's SLA
    // scale x1000, the percentile table's "Latency (s)" header, the list
    // column's "Avg (s)" subtitle) — only this card used to label it ms, which
    // read as a 1000x faster response than measured.
    title: 'benchmark.detail.avg.reqLatency',
    path: 'request_latency_mean',
    unit: 's',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'benchmark.detail.avg.ttft',
    path: 'time_to_first_token_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    // Decode-only TPOT = guidellm's `inter_token_latency_ms`. Its
    // `time_per_output_token_ms` also divides by output tokens but starts the
    // clock at request_start, so it includes TTFT; that one is not displayed.
    title: 'benchmark.detail.avg.tpot',
    path: 'inter_token_latency_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    // The tail, next to the averages it qualifies. A second per-token column
    // used to sit here; the two were the same metric under swapped names.
    title: 'benchmark.detail.p99.ttft',
    path: 'time_to_first_token_p99',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  }
];

const MetricsResult: React.FC<{ data?: any }> = (props) => {
  const { styles } = useStyles();
  const { detailData } = useDetailContext();
  const data = props.data ?? detailData;
  const intl = useIntl();
  const t = (id?: string) => (id ? intl.formatMessage({ id }) : '');

  const bench0 = ['raw_metrics', 'benchmarks', '0'];
  const reqTotal = (k: string) =>
    round(_.get(data, [...bench0, 'metrics', 'request_totals', k]), 0) || 0;
  const success = reqTotal('successful');
  const failed = reqTotal('errored');
  const incomplete = reqTotal('incomplete');
  // Actual number of requests made this run. Prefer the measured total from
  // request_totals; fall back to the configured `total_requests` (which is empty
  // for stages / auto-tune runs, so it must NOT be the denominator — that showed
  // "20/0"), then to the sum of the status buckets.
  const total =
    reqTotal('total') ||
    round(data?.total_requests ?? 0, 0) ||
    success + failed + incomplete;
  const concAvg =
    round(
      _.get(data, [
        ...bench0,
        'metrics',
        'request_concurrency',
        'successful',
        'mean'
      ]),
      0
    ) || 0;
  const duration = _.get(data, [...bench0, 'duration']);

  const row = (
    key: string,
    label: React.ReactNode,
    value: React.ReactNode,
    unit?: string
  ) => (
    <div className="metric" key={key}>
      <span className="m-label">{label}</span>
      <span className="m-value">{value}</span>
      <span className="m-unit">{unit}</span>
    </div>
  );

  const basicRows: React.ReactNode[] = [];
  // The selected stage's load value lives here now (no separate header line).
  if (data?.rate != null) {
    basicRows.push(
      row(
        'rate',
        t(loadAxisLabelId(detailData)),
        round(data.rate, loadValueDecimals(detailData)),
        t(
          loadValueDecimals(detailData) === 0
            ? 'benchmark.table.best.unit.concurrency'
            : 'benchmark.table.best.unit.rate'
        )
      )
    );
  }
  basicRows.push(
    row(
      'requests',
      t('benchmark.detail.summary.request'),
      <>
        {success}/{total}
        {failed > 0 && (
          <span className="sub" style={{ color: 'var(--ant-color-error)' }}>
            {' '}
            · {failed} {t('benchmark.detail.requests.failed')}
          </span>
        )}
        {incomplete > 0 && (
          <span className="sub" style={{ color: 'var(--ant-color-warning)' }}>
            {' '}
            · {incomplete} {t('benchmark.detail.requests.incomplete')}
          </span>
        )}
      </>
    )
  );
  basicRows.push(
    row('conc', t('benchmark.detail.requests.concurrency'), concAvg)
  );
  basicRows.push(
    row(
      'duration',
      t('benchmark.detail.result.duration'),
      duration ? round(duration, 2) : 0,
      's'
    )
  );

  const renderGroup = (titleId: string, cols: MetricDef[]) => (
    <div className="group">
      <div className="g-title">{t(titleId)}</div>
      {cols.map((c) =>
        row(c.title, t(c.title), c.render(_.get(data, c.path) ?? 0), c.unit)
      )}
    </div>
  );

  return (
    <div className={styles.box}>
      <div className="group">
        <div className="g-title">{t('benchmark.detail.result.basic')}</div>
        {basicRows}
      </div>
      {renderGroup('benchmark.detail.summary.throughput', throughputColumns)}
      {renderGroup('benchmark.detail.summary.latency', latencyColumns)}
    </div>
  );
};

export default MetricsResult;
