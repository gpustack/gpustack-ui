import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ModelMetric } from '../../config/types';
import { pdTimingMetric } from '../pd-timing';

const metric = (): ModelMetric => ({
  kind: 'histogram',
  unit: 'seconds',
  measurement_scope: 'engine_local',
  status: 'available',
  reason: null,
  supported_statistics: ['avg', 'p50', 'p95', 'p99'],
  series: ['prefill', 'decode'].flatMap((role, index) =>
    (['avg', 'p99'] as const).map((statistic) => ({
      name: role,
      statistic,
      dimensions: { role, model_instance_id: index + 1 },
      points: [[100, statistic === 'avg' ? 0 : 3]]
    }))
  ),
  summaries: ['prefill', 'decode'].map((role) => ({
    statistic: 'p99',
    dimensions: { role },
    value: 3
  }))
});

test('timing composition preserves all statistics and exact role/instance identities for global filtering', () => {
  const source = metric();
  const result = pdTimingMetric(source, 'decode')!;
  assert.deepEqual(
    result.series.map((line) => line.statistic),
    ['avg', 'p99']
  );
  assert.equal(result.series[0].dimensions.model_instance_id, 2);
  assert.deepEqual(result.series[0].points, [[100, 0]]);
  assert.ok(result.series.every((line) => line.comparisonMeasure));
  assert.equal(source.series[0].comparisonMeasure, undefined);
});

test('censored quantiles and diagnostic failures survive timing composition', () => {
  const source = metric();
  source.series[3] = {
    ...source.series[3],
    points: [[100, null]],
    lower_bounds: [[100, 5]]
  };
  const result = pdTimingMetric(source, 'decode')!;
  assert.deepEqual(result.series[1].lower_bounds, [[100, 5]]);
  const failed = pdTimingMetric(
    { ...source, status: 'query_error', reason: 'query_failed' },
    'decode'
  )!;
  assert.equal(failed.status, 'query_error');
  assert.equal(failed.reason, 'query_failed');
});
