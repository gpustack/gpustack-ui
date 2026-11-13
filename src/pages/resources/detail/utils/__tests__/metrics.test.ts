import type { ModelMetric } from '@/pages/llmodels/detail/config/types';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  combineMemory,
  memoryPercentage,
  reportedGPUCount,
  samplingIsStale
} from '../metrics';
import { resourceHref, timeScopeFromParams } from '../navigation';
const metric = (
  points: [number, number | null][],
  id = 'gpu-a'
): ModelMetric => ({
  kind: 'gauge',
  unit: 'bytes',
  status: 'available',
  reason: null,
  measurement_scope: 'physical_gpu',
  supported_statistics: ['current'],
  series: [
    {
      name: 'GPU 0',
      dimensions: { device_id: id, worker_id: 7 },
      statistic: 'current',
      points
    }
  ],
  summaries: [
    {
      statistic: 'current',
      dimensions: { device_id: id, worker_id: 7 },
      value: points.at(-1)?.[1] ?? null
    }
  ]
});
test('memory ratio matches both device identity and exact timestamp; missing is not zero', () => {
  const result = memoryPercentage(
    metric([
      [100, 0],
      [115, 50],
      [130, 50]
    ]),
    metric([
      [100, 100],
      [130, null]
    ])
  );
  assert.deepEqual(result?.series[0].points, [
    [100, 0],
    [115, null],
    [130, null]
  ]);
  assert.equal(result?.summaries[0].value, null);
  assert.equal(
    memoryPercentage(metric([[100, 30]]), metric([[100, 100]], 'gpu-b'))
      ?.series[0].points[0][1],
    null
  );
});
test('zero capacity and nonfinite inputs do not yield an infinite or invented ratio', () => {
  assert.equal(
    memoryPercentage(metric([[100, 10]]), metric([[100, 0]]))?.series[0]
      .points[0][1],
    null
  );
  assert.equal(
    memoryPercentage(metric([[100, Number.NaN]]), metric([[100, 100]]))
      ?.series[0].points[0][1],
    null
  );
});
test('memory composition retains distinct measure identities and source failure', () => {
  const used = metric([[100, 5]]),
    total = metric([[100, 100]]);
  const result = combineMemory(used, total, 'Used', 'Total')!;
  assert.equal(result.series.length, 2);
  assert.notEqual(
    result.series[0].compositionKey,
    result.series[1].compositionKey
  );
  assert.equal(
    combineMemory(used, undefined, 'Used', 'Total')?.reason,
    'partial_metric_data'
  );
});
test('resource navigation keeps fixed endpoints and avoids Model role or instance filters', () => {
  const href = resourceHref(
    { kind: 'gpu', id: '7', deviceId: 'stable-a' },
    { window: '1h', start: 1730000000, end: 1730003600 },
    'monitoring'
  );
  assert.equal(
    href,
    '#/resources/gpus/detail?worker_id=7&device_id=stable-a&start=1730000000&end=1730003600&tab=monitoring'
  );
  assert.deepEqual(timeScopeFromParams(new URLSearchParams('start=0&end=2')), {
    window: '1h'
  });
  assert.deepEqual(timeScopeFromParams(new URLSearchParams('window=2d')), {
    window: '2d'
  });
});

test('sampling notice consolidates stale sources without hiding partially live data', () => {
  const stale = {
    ...metric([[100, 4]]),
    status: 'stale' as const,
    reason: 'no_recent_samples'
  };
  assert.equal(samplingIsStale({ gpu: stale, host: stale }), true);
  assert.equal(
    samplingIsStale({ gpu: stale, host: metric([[100, 4]]) }),
    false
  );
  assert.equal(
    samplingIsStale({ empty: { ...stale, status: 'no_data' } }),
    false
  );
  assert.equal(samplingIsStale(), false);
});

test('missing GPU inventory is unknown rather than a CPU-only zero', () => {
  assert.equal(reportedGPUCount(undefined, 0), null);
  assert.equal(reportedGPUCount(null, 0), null);
  assert.equal(reportedGPUCount([], 0), 0);
  assert.equal(reportedGPUCount([{ index: null }], 0), null);
  assert.equal(reportedGPUCount([{}, {}], 2), 2);
});
