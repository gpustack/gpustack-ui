import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ModelMetric } from '../../config/types';
import {
  normalizeLatencyStatistics,
  selectLatencyStatistics
} from '../latency-statistics';

const metric = (): ModelMetric => ({
  kind: 'histogram',
  unit: 'seconds',
  measurement_scope: 'engine_local',
  status: 'available',
  reason: null,
  supported_statistics: ['avg', 'p50', 'p95', 'p99'],
  series: (['avg', 'p50', 'p95', 'p99'] as const).map((statistic) => ({
    name: 'Decode',
    statistic,
    dimensions: { role: 'decode', model_instance_id: 7 },
    points: [[100, statistic === 'avg' ? 0 : null]],
    ...(statistic === 'p99'
      ? { lower_bounds: [[100, 5] as [number, number]] }
      : {})
  })),
  summaries: [
    {
      statistic: 'p99',
      dimensions: { role: 'decode' },
      value: null,
      lower_bound: 5
    }
  ]
});

test('multi-selection keeps original samples, real zero, instance identity and censored quantiles without mutating raw metrics', () => {
  const source = metric();
  const result = selectLatencyStatistics(source, ['avg', 'p99']);
  assert.deepEqual(
    result.metric?.series.map((line) => line.statistic),
    ['avg', 'p99']
  );
  assert.deepEqual(result.metric?.series[0].points, [[100, 0]]);
  assert.deepEqual(result.metric?.series[1].lower_bounds, [[100, 5]]);
  assert.equal(result.metric?.series[1].dimensions.model_instance_id, 7);
  assert.equal(result.metric?.summaries[0].lower_bound, 5);
  assert.equal(source.series.length, 4);
});

test('Avg-only ingress stays explicitly Avg while unsupported selections never silently borrow another statistic', () => {
  const source = metric();
  const avg = {
    ...source,
    measurement_scope: 'service_ingress',
    supported_statistics: ['avg' as const],
    series: source.series.slice(0, 1),
    summaries: []
  };
  const fixed = selectLatencyStatistics(avg, ['p99']);
  assert.equal(fixed.fixedAverage, true);
  assert.deepEqual(fixed.statistics, ['avg']);
  assert.equal(fixed.metric?.series[0].statistic, 'avg');
  const p99 = {
    ...source,
    supported_statistics: ['p99' as const],
    series: source.series.slice(3)
  };
  const missing = selectLatencyStatistics(p99, ['avg']);
  assert.deepEqual(missing.metric?.series, []);
  assert.equal(missing.metric?.status, 'unsupported');
  assert.equal(missing.metric?.reason, 'statistic_not_supported');
  const failed = selectLatencyStatistics({ ...p99, reason: 'query_failed' }, [
    'avg'
  ]);
  assert.equal(failed.metric?.status, 'available');
  assert.equal(
    failed.metric?.reason,
    'query_failed',
    'a partial query failure is not relabelled as a capability absence'
  );
});

test('global timing selection leaves gauges, rates, non-duration histograms and diagnostic failures intact', () => {
  const source = metric();
  for (const other of [
    { ...source, kind: 'gauge' as const },
    { ...source, kind: 'counter' as const },
    { ...source, unit: 'bytes' }
  ]) {
    assert.equal(selectLatencyStatistics(other, ['p99']).metric, other);
  }
  for (const status of [
    'query_error',
    'restricted',
    'no_data',
    'unsupported'
  ] as const) {
    const failed = {
      ...source,
      status,
      reason: 'query_failed',
      series: [],
      summaries: []
    };
    assert.equal(
      selectLatencyStatistics(failed, ['p95']).metric?.status,
      status
    );
    assert.equal(
      selectLatencyStatistics(failed, ['p95']).metric?.reason,
      'query_failed'
    );
  }
});

test('selection is canonical, bounded to supported names and always has at least one statistic', () => {
  assert.deepEqual(normalizeLatencyStatistics(['p99', 'avg', 'p99', 'bad']), [
    'avg',
    'p99'
  ]);
  assert.deepEqual(normalizeLatencyStatistics([]), ['p99']);
  assert.deepEqual(normalizeLatencyStatistics(undefined), ['p99']);
});
