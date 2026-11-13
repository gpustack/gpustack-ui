import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  labelHardwareMetric,
  resourceWorkerNames,
  selectDeviceMetric
} from '../hardware-metrics';

const device: any = {
  id: 'gpu-a',
  worker_id: 1,
  worker_name: 'worker-a',
  index: 0,
  chip_index: 0,
  scope: 'physical_gpu',
  model_instance_ids: [1],
  reason: null,
  current: { gpu_utilization: 99 }
};
const metric: any = {
  kind: 'gauge',
  unit: 'percent',
  status: 'available',
  reason: 'partial_metric_data',
  series: [
    {
      name: 'gpu_utilization',
      statistic: 'current',
      dimensions: { device_id: 'gpu-a', worker_id: 1 },
      points: [[100, 0]]
    },
    {
      name: 'gpu_utilization',
      statistic: 'current',
      dimensions: { device_id: 'gpu-b', worker_id: 1 },
      points: [[100, 80]]
    }
  ],
  summaries: [
    {
      statistic: 'current',
      dimensions: { device_id: 'gpu-a', worker_id: 1 },
      value: 0
    },
    {
      statistic: 'current',
      dimensions: { device_id: 'gpu-b', worker_id: 1 },
      value: 80
    }
  ]
};

test('hardware labels distinguish devices and meaningful chips without changing identities or values', () => {
  const data: any = {
    devices: [device, { ...device, id: 'gpu-b', chip_index: 2 }],
    workers: [{ id: 1, name: 'worker-a' }]
  };
  const original = JSON.stringify(metric);
  const result = labelHardwareMetric(metric, data, false, 'Chip')!;
  assert.deepEqual(
    result.series.map((line) => line.name),
    ['worker-a / GPU 0', 'worker-a / GPU 0 · Chip 2']
  );
  assert.deepEqual(
    result.series.map((line) => line.dimensions.device_id),
    ['gpu-a', 'gpu-b']
  );
  assert.equal(JSON.stringify(metric), original);
});

test('Worker names are unique by authorized Worker identity and include CPU-only workers', () => {
  const names = resourceWorkerNames({
    devices: [device, { ...device, id: 'gpu-b' }],
    workers: [
      { id: 1, name: 'worker-a' },
      { id: 2, name: 'router-only' }
    ]
  } as any);
  assert.deepEqual(
    [...names],
    [
      [1, 'worker-a'],
      [2, 'router-only']
    ]
  );
});

test('drawer keeps a real zero and clears unrelated-device partial notices', () => {
  const result = selectDeviceMetric(metric, device, 'gpu_utilization')!;
  assert.equal(result.series.length, 1);
  assert.deepEqual(result.series[0].points, [[100, 0]]);
  assert.equal(result.summaries[0].value, 0);
  assert.equal(result.status, 'available');
  assert.equal(result.reason, null);
});

test('missing selected history cannot borrow another GPU or a current inventory snapshot', () => {
  const result = selectDeviceMetric(
    metric,
    { ...device, id: 'missing' },
    'gpu_utilization'
  )!;
  assert.deepEqual(result.series, []);
  assert.deepEqual(result.summaries, []);
  assert.equal(result.status, 'no_data');
  assert.equal(result.reason, 'no_samples');
});

test('selected historic readings remain stale when only another GPU has a current sample', () => {
  const result = selectDeviceMetric(
    { ...metric, summaries: metric.summaries.slice(1) },
    device,
    'gpu_utilization'
  )!;
  assert.equal(result.status, 'stale');
  assert.equal(result.reason, 'no_recent_samples');
});

test('partitions do not invent whole-device utilization history', () => {
  const result = selectDeviceMetric(
    metric,
    { ...device, scope: 'partition' },
    'gpu_utilization'
  )!;
  assert.equal(result.status, 'unsupported');
  assert.equal(result.reason, 'metric_not_provided');
  assert.deepEqual(result.series, []);
});

for (const [status, reason] of [
  ['query_error', 'query_failed'],
  ['unsupported', 'metric_not_provided'],
  ['restricted', 'resource_not_visible']
] as const) {
  test(`selected device retains the family's ${status} state without replacing it with no data`, () => {
    const result = selectDeviceMetric(
      { ...metric, status, reason, series: [], summaries: [] },
      device,
      'gpu_utilization'
    )!;
    assert.equal(result.status, status);
    assert.equal(result.reason, reason);
  });
}

for (const status of ['available', 'stale'] as const) {
  test(`an ${status} family's missing device samples do not borrow another sensor's query failure`, () => {
    const result = selectDeviceMetric(
      {
        ...metric,
        status,
        series: metric.series.slice(1),
        summaries: metric.summaries.slice(1)
      },
      { ...device, reason: 'query_failed' },
      'gpu_utilization'
    )!;
    assert.deepEqual(result.series, []);
    assert.deepEqual(result.summaries, []);
    assert.equal(result.status, 'no_data');
    assert.equal(result.reason, 'no_samples');
  });
}
