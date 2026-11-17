import assert from 'node:assert/strict';
import { test } from 'node:test';
import { segmentLayout } from '../chart-segments';

const segments = [
  {
    id: 'a',
    start: 100,
    end: 120,
    label: '280',
    caption: '#13',
    description: '280 concurrency'
  },
  {
    id: 'b',
    start: 200,
    end: 260,
    label: '281',
    caption: '#16',
    description: '281 concurrency'
  },
  {
    id: 'c',
    start: 120,
    end: 150,
    label: '282',
    caption: '#15',
    description: '282 concurrency'
  }
];
const times = [100, 110, 120, 130, 140, 150, 200, 220, 240, 260];
test('load display order retains original timestamps and isolates each measurement', () => {
  const layout = segmentLayout(segments, times);
  assert.deepEqual(
    layout.samples.map((e) => times[e.sourceIndex]),
    [100, 110, 200, 220, 240, 120, 130, 140]
  );
  assert.equal(new Set(layout.samples.map((e) => e.sourceIndex)).size, 8);
  assert.equal(layout.entries.filter((e) => e.sourceIndex === null).length, 3);
  assert.ok(
    layout.samples.every((e, i, a) => !i || e.coordinate > a[i - 1].coordinate)
  );
  assert.equal(layout.dataIndexForTimestamp(130), 8);
  assert.equal(layout.dataIndexForTimestamp(150), -1);
});
test('equal width segments preserve relative progress rather than implying equal durations', () => {
  const layout = segmentLayout(segments, times);
  assert.ok(
    layout.chunks.every((c) => Math.abs(c.right - c.left - 0.88) < 1e-8)
  );
  assert.equal(layout.sampleAtCoordinate(0)?.sourceIndex, 1);
  assert.equal(layout.sampleAtCoordinate(1)?.sourceIndex, 7);
  assert.equal(layout.sampleAtCoordinate(2)?.sourceIndex, 3);
  assert.equal(layout.sampleAtCoordinate(-1), undefined);
  assert.equal(layout.sampleAtCoordinate(Infinity), undefined);
});
test('phase boundaries are half open and missing phases never borrow neighboring samples', () => {
  const layout = segmentLayout(
    [...segments, { ...segments[0], id: 'empty', start: 300, end: 400 }],
    times
  );
  assert.equal(
    layout.samples.find((e) => times[e.sourceIndex] === 120)?.segment.id,
    'c'
  );
  assert.equal(layout.sampleAtCoordinate(3), undefined);
  assert.deepEqual(layout.bands({ start: 200, end: 260 }), [
    { start: 0.56, end: 1.44 }
  ]);
  assert.deepEqual(layout.bands({ start: 500, end: 600 }), []);
});
test('untimed and invalid phases do not invent segments or observations', () => {
  const layout = segmentLayout(
    [
      { ...segments[0], end: NaN },
      { ...segments[1], end: 200 }
    ],
    times
  );
  assert.deepEqual(layout.chunks, []);
  assert.equal(layout.dataIndexForTimestamp(100), -1);
  assert.equal(layout.sampleAtCoordinate(0), undefined);
});
