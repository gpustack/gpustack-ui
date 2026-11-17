import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  alignedPoints,
  displayCapacityValue,
  displayMetricValue,
  displayObservationValue,
  hasMetricSamples,
  metricLowerBound,
  metricValue,
  selectRoleMetric,
  summaryStatistics
} from '../metrics';

test('histogram lower bounds retain units and zero without replacing an exact observation', () => {
  assert.equal(displayObservationValue(null, 5, 'seconds'), '> 5,000');
  assert.equal(displayMetricValue(null, 'seconds', 'ttft', 5), '> 5,000 ms');
  assert.equal(displayMetricValue(null, 'seconds', 'tpot', 0), '> 0 ms/token');
  assert.equal(displayMetricValue(0, 'seconds', 'ttft', 5), '0 ms');
  assert.equal(
    displayMetricValue(null, 'seconds', undefined, 0.005559),
    '> 5.55 ms'
  );
  assert.equal(
    displayMetricValue(null, 'seconds', undefined, 0.000000123),
    '> 0.00012 ms'
  );
  assert.equal(
    displayMetricValue(null, 'bytes', undefined, 1024 ** 3),
    '> 1 GiB'
  );
  assert.equal(displayMetricValue(null, 'seconds', undefined, Infinity), '—');
  const metric: any = {
    summaries: [{ statistic: 'p99', value: null, lower_bound: 5 }],
    series: [{ points: [[100, null]], lower_bounds: [[100, 5]] }]
  };
  assert.equal(hasMetricSamples(metric), true);
  assert.equal(metricLowerBound(metric, 'p99'), 5);
  assert.equal(
    summaryStatistics(metric).find((row) => row.statistic === 'p99')
      ?.lowerBound,
    5
  );
});

test('missing observations have one unitless placeholder while real zero keeps its unit', () => {
  for (const unit of [
    'seconds',
    'bytes',
    'percent',
    'watts',
    'celsius',
    'tokens_per_second'
  ]) {
    for (const value of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY])
      assert.equal(displayMetricValue(value, unit), '—');
    assert.notEqual(displayMetricValue(0, unit), '—');
  }
  assert.equal(displayMetricValue(0, 'seconds', 'tpot'), '0 ms/token');
  assert.equal(displayMetricValue(0, 'bytes'), '0 GiB');
  assert.equal(displayCapacityValue(null, null), '—');
  assert.equal(displayCapacityValue(0, 1024 ** 3), '0 / 1 GiB');
  assert.equal(displayCapacityValue(null, 1024 ** 3), '— / 1 GiB');
  assert.equal(displayCapacityValue(0, null), '0 GiB / —');
});

test('PD connector bandwidth and Router rate use readable units without rounding valid fractions away', () => {
  assert.equal(
    displayMetricValue(2.5 * 1024 ** 2, 'bytes_per_second'),
    '2.5 MiB/s'
  );
  assert.equal(displayMetricValue(0.25, 'requests_per_second'), '0.25 req/s');
  assert.equal(displayMetricValue(0, 'bytes_per_second'), '0 MiB/s');
  assert.equal(displayMetricValue(null, 'requests_per_second'), '—');
});

test('timestamp union preserves gaps, zero and finite values without zero filling', () => {
  const rows = alignedPoints([
    {
      name: 'A',
      points: [
        [100, 0],
        [102, null]
      ]
    },
    {
      name: 'B',
      points: [
        [101, 2],
        [102, Number.NaN]
      ]
    }
  ] as any);
  assert.deepEqual(rows, {
    timestamps: [100, 101, 102],
    values: [
      [0, null, null],
      [null, 2, null]
    ]
  });
});
test('interval summaries retain Avg/P50/P95/P99 and cannot borrow a trend maximum', () => {
  const metric: any = {
    summaries: [
      { statistic: 'avg', value: 0.01, dimensions: {} },
      { statistic: 'p95', value: 0.03, dimensions: {} }
    ],
    series: [{ points: [[100, 99]] }]
  };
  assert.deepEqual(
    summaryStatistics(metric).map((x) => [x.statistic, x.value]),
    [
      ['avg', 0.01],
      ['p50', null],
      ['p95', 0.03],
      ['p99', null]
    ]
  );
  assert.equal(metricValue(metric, 'p95'), 0.03);
});
test('PD role-local metrics default to Decode while explicit Prefill remains local', () => {
  const metric: any = {
    series: [
      { dimensions: { role: 'prefill' }, points: [] },
      { dimensions: { role: 'decode' }, points: [] }
    ],
    summaries: [
      { dimensions: { role: 'prefill' }, value: 1 },
      { dimensions: { role: 'decode' }, value: 2 }
    ]
  };
  assert.deepEqual(
    selectRoleMetric(metric, true, 'all')!.summaries.map((x: any) => x.value),
    [2]
  );
  assert.deepEqual(
    selectRoleMetric(metric, true, 'prefill')!.summaries.map(
      (x: any) => x.value
    ),
    [1]
  );
  assert.equal(selectRoleMetric(metric, false, 'all')!.series.length, 2);
});
test('TPOT has a per-token display unit while source duration and ITL remain seconds/ms', async () => {
  const { displayUnit } = await import('../metrics');
  assert.equal(displayUnit('seconds', 'tpot'), 'ms/token');
  assert.equal(displayUnit('seconds', 'itl'), 'ms');
});

test('missing Decode observations do not produce an Available label on an empty role-local chart', () => {
  const metric: any = {
    status: 'available',
    reason: null,
    series: [
      {
        name: 'P95',
        statistic: 'p95',
        dimensions: { role: 'prefill' },
        points: [[100, 0.01]]
      }
    ],
    summaries: [
      { statistic: 'p95', dimensions: { role: 'prefill' }, value: 0.01 }
    ]
  };
  const selected = selectRoleMetric(metric, true, 'all')!;
  assert.equal(selected.status, 'no_data');
  assert.equal(selected.reason, 'no_samples');
});
