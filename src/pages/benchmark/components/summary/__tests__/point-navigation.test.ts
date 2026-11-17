import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  comparisonPoint,
  loadOrderedPoints,
  measurementNumber,
  monitoredLoadPoints,
  pointFindings,
  searchGroups
} from '../point-navigation';

const points = [256, 512, 384, 280, 282, 281].map((load, sequence) => ({
  id: sequence + 10,
  load,
  tps: 1000 + load,
  sloPass: load <= 281,
  raw: { id: sequence + 10, rate: load, sequence, input_tokens: 128 }
})) as any;

test('load order retains execution numbers and result identities', () => {
  const sorted = loadOrderedPoints(points);
  assert.deepEqual(
    sorted.map((p) => p.load),
    [256, 280, 281, 282, 384, 512]
  );
  assert.equal(measurementNumber(sorted[2], []), 6);
  assert.equal(sorted[2].id, 15);
  assert.deepEqual(
    points.map((p: any) => p.load),
    [256, 512, 384, 280, 282, 281]
  );
});

test('adjacent load and previous execution use different points in the same workload', () => {
  const selected = points.at(-1);
  assert.equal(comparisonPoint(points, selected, [], 'adjacent')?.load, 280);
  assert.equal(comparisonPoint(points, selected, [], 'previous')?.load, 282);
  const other = {
    ...points[4],
    id: 99,
    load: 280.5,
    raw: { ...points[4].raw, input_tokens: 256 }
  };
  assert.equal(
    comparisonPoint([...points, other], selected, [], 'adjacent')?.load,
    280
  );
});

test('search groups follow recorded load history without moving refinements before expansion', () => {
  const groups = searchGroups(points, [], 'auto_tune');
  assert.deepEqual(
    groups.map((g) => [g.phase, g.points.map((p) => p.load)]),
    [
      ['expand', [256, 512]],
      ['refine', [384, 280, 282, 281]]
    ]
  );
  assert.deepEqual(
    searchGroups(points, [], 'stages').map((g) => g.phase),
    ['manual']
  );
  assert.deepEqual(
    searchGroups([points[0]], [], 'single').map((g) => g.phase),
    ['single']
  );
});

test('repeated loads remain independently selectable and do not become adjacent lower loads', () => {
  const repeat = {
    ...points.at(-1),
    id: 98,
    raw: { ...points.at(-1).raw, sequence: 6 }
  };
  assert.equal(
    loadOrderedPoints([...points, repeat]).filter((p) => p.load === 281).length,
    2
  );
  assert.equal(
    comparisonPoint([...points, repeat], repeat, [], 'previous')?.id,
    points.at(-1).id
  );
  assert.equal(
    comparisonPoint([...points, repeat], repeat, [], 'adjacent')?.load,
    280
  );
});

test('findings report measured SLO boundary and throughput peak separately', () => {
  const result = pointFindings(points, points.at(-1));
  assert.equal(result.capacity?.load, 281);
  assert.equal(result.breach?.load, 282);
  assert.equal(result.peak?.load, 512);
  assert.equal(
    pointFindings(
      points.map((p: any) => ({ ...p, sloPass: null })),
      points.at(-1)
    ).capacity,
    undefined
  );
});

test('monitoring segments retain repeated loads and exclude other workloads, probes and missing bounds', () => {
  const repeated = {
    ...points[5],
    id: 99,
    raw: { ...points[5].raw, sequence: 6 }
  };
  const other = {
    ...points[4],
    id: 98,
    raw: { ...points[4].raw, input_tokens: 256 }
  };
  const phases = points.map((p: any) => ({
    id: `128:${p.raw.sequence}`,
    sequence: p.raw.sequence,
    input_tokens: 128,
    start: 100 + p.raw.sequence * 10,
    end: 110 + p.raw.sequence * 10,
    status: 'available'
  }));
  phases.push({ ...phases[5], id: '128:6', sequence: 6, start: 160, end: 170 });
  const segments = monitoredLoadPoints(
    [...points, repeated, other],
    points[5],
    phases as any
  );
  assert.deepEqual(
    segments.filter((s) => s.point.load === 281).map((s) => s.point.id),
    [15, 99]
  );
  assert.ok(segments.every((s) => s.point.raw.input_tokens === 128));
  assert.equal(
    monitoredLoadPoints(
      points,
      points[5],
      phases.map((p: any) => ({ ...p, status: 'unavailable' })) as any
    ).length,
    0
  );
  assert.deepEqual(
    monitoredLoadPoints(
      points,
      { ...points[5], raw: { ...points[5].raw, rate: null } },
      phases as any
    ),
    []
  );
});
