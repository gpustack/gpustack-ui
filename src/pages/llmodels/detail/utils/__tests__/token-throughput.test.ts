import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withTokenTotal } from '../token-throughput';

const rate = (points: [number, number | null][], role?: string): any => ({
  kind: 'counter',
  unit: 'tokens_per_second',
  status: 'available',
  reason: null,
  measurement_scope: 'engine_processed_tokens',
  supported_statistics: ['rate'],
  summaries: [],
  series: [
    {
      name: role || 'Deployment',
      statistic: 'rate',
      dimensions: { role },
      points
    }
  ]
});
const combine = (input: any, output: any) => ({
  ...input,
  series: [...input.series, ...(output?.series || [])]
});

test('Total adds input and output rates, preserves real zero and never mutates source data', () => {
  const input = rate([
    [100, 100],
    [101, 0]
  ]);
  const output = rate([
    [100, 20],
    [101, 0]
  ]);
  const metric = combine(input, output);
  const before = JSON.stringify({ input, output, metric });
  const result = withTokenTotal({
    metric,
    input,
    output,
    totalLabel: 'Total',
    pd: false
  })!;
  assert.deepEqual(result.series.at(-1)?.points, [
    [100, 120],
    [101, 0]
  ]);
  assert.equal(result.series.at(-1)?.name, 'Total · Deployment');
  assert.deepEqual(result.series.at(-1)?.dimensions, {});
  assert.equal(JSON.stringify({ input, output, metric }), before);
});

test('Total preserves timestamp gaps and nulls instead of summing an absent side as zero', () => {
  const input = rate([
    [100, 1],
    [101, 2],
    [102, null]
  ]);
  const output = rate([
    [100, 3],
    [102, 5],
    [103, 4]
  ]);
  const result = withTokenTotal({
    metric: combine(input, output),
    input,
    output,
    totalLabel: 'Total',
    pd: false
  })!;
  assert.deepEqual(result.series.at(-1)?.points, [
    [100, 4],
    [101, null],
    [102, null],
    [103, null]
  ]);
});

test('PD Total uses Prefill input and Decode output once even if other role counters exist', () => {
  const input = rate([[100, 100]], 'prefill');
  input.series.push(...rate([[100, 100]], 'decode').series);
  const output = rate([[100, 20]], 'decode');
  output.series.push(...rate([[100, 20]], 'prefill').series);
  const result = withTokenTotal({
    metric: combine(input, output),
    input,
    output,
    totalLabel: 'Total',
    pd: true
  })!;
  assert.deepEqual(result.series.at(-1)?.points, [[100, 120]]);
});

test('unavailable or partial sides do not produce a misleading complete Total', () => {
  const input = rate([[100, 100]]);
  const output = rate([[100, 20]]);
  for (const incomplete of [
    undefined,
    { ...output, status: 'query_error' },
    {
      ...output,
      coverage: { expected_instances: 2, observed_instances: 1, partial: true }
    }
  ]) {
    const result = withTokenTotal({
      metric: combine(input, incomplete),
      input,
      output: incomplete,
      totalLabel: 'Total',
      pd: false
    })!;
    assert.deepEqual(result.series.at(-1)?.points, [[100, null]]);
  }
});

test('an incomplete ordinary replica is not silently omitted from Total', () => {
  const input = rate([[100, 60]]);
  input.series.push(...rate([[100, 40]]).series);
  const output = rate([[100, 20]]);
  const result = withTokenTotal({
    metric: combine(input, output),
    input,
    output,
    totalLabel: 'Total',
    pd: false
  })!;
  assert.deepEqual(result.series.at(-1)?.points, [[100, 120]]);
  input.series[1].points = [[100, null]];
  const missing = withTokenTotal({
    metric: combine(input, output),
    input,
    output,
    totalLabel: 'Total',
    pd: false
  })!;
  assert.deepEqual(missing.series.at(-1)?.points, [[100, null]]);
});

test('no base observations do not fabricate a token chart', () => {
  const input = rate([[100, 100]]),
    output = rate([[100, 20]]);
  assert.equal(
    withTokenTotal({
      metric: undefined,
      input,
      output,
      totalLabel: 'Total',
      pd: false
    }),
    undefined
  );
});
