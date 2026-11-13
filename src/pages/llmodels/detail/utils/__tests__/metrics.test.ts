import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  alignedPoints,
  metricValue,
  selectRoleMetric,
  summaryStatistics
} from '../metrics';

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
