import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  containsTimestamp,
  isFocusedSeries,
  nearestTimestampIndex,
  visibleTimeBands,
  type ChartTimeBand
} from '../chart-context';

test('adjacent stage intervals never highlight the same boundary sample', () => {
  const first = { start: 100, end: 160 };
  const next = { start: 160, end: 190 };
  assert.equal(containsTimestamp(first, 160), false);
  assert.equal(containsTimestamp(next, 160), true);
  assert.equal(containsTimestamp(first, 159), true);
});

test('zooming clips comparison bands without changing recorded intervals', () => {
  const bands: ChartTimeBand[] = [
    { start: 100, end: 160, label: 'Base', kind: 'baseline' },
    { start: 160, end: 190, label: 'Current', kind: 'selected' }
  ];
  assert.deepEqual(visibleTimeBands(bands, { start: 150, end: 180 }), [
    { ...bands[0], start: 150 },
    { ...bands[1], end: 180 }
  ]);
  assert.equal(visibleTimeBands(bands, { start: 190, end: 200 }).length, 0);
  assert.equal(visibleTimeBands([{ ...bands[0], end: Infinity }]).length, 0);
  assert.equal(bands[0].start, 100);
});

test('instance and linked resource focus changes emphasis without filtering data', () => {
  const instance: any = { dimensions: { model_instance_id: 3 } };
  const gpu: any = { dimensions: { device_id: 'gpu-1', worker_id: 7 } };
  assert.equal(isFocusedSeries(instance), true);
  assert.equal(
    isFocusedSeries(instance, { dimension: 'device_id', values: [] }),
    false
  );
  assert.equal(
    isFocusedSeries(instance, { dimension: 'model_instance_id', values: [3] }),
    true
  );
  assert.equal(
    isFocusedSeries(instance, { dimension: 'model_instance_id', values: [4] }),
    false
  );
  assert.equal(
    isFocusedSeries(gpu, { dimension: 'device_id', values: ['gpu-1'] }),
    true
  );
  assert.equal(
    isFocusedSeries(gpu, { dimension: 'worker_id', values: [7] }),
    true
  );
});

test('shared cursor resolves samples by timestamp across different sampling steps', () => {
  assert.equal(nearestTimestampIndex([100, 115, 130, 145], 119), 1);
  assert.equal(nearestTimestampIndex([100, 130, 160], 119), 1);
  assert.equal(nearestTimestampIndex([100, 130, 160], 115), 0);
  assert.equal(nearestTimestampIndex([], 115), -1);
  assert.equal(nearestTimestampIndex([100], NaN), -1);
});
