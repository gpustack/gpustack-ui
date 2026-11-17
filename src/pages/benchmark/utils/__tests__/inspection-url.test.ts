import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { StagePoint } from '../../components/summary/metrics';
import type {
  BenchmarkMonitoring,
  BenchmarkMonitoringData
} from '../../config/monitoring-types';
import {
  benchmarkInspectionCursor,
  benchmarkInspectionQuery,
  benchmarkInspectionRun,
  readBenchmarkInspection,
  resolveBenchmarkInspection,
  writeBenchmarkInspection
} from '../inspection-url';

test('inspection links scope the execution without pinning an archived copy', () => {
  const run = 'e91694a5-2949-4fd9-aa60-b895e572de69';
  assert.equal(
    benchmarkInspectionRun(
      new URLSearchParams(`run_id=${run}&archive_revision=2`)
    ),
    run
  );
  assert.equal(
    benchmarkInspectionRun(new URLSearchParams(`run_id=${run}&run_id=${run}`)),
    undefined
  );
  assert.equal(
    benchmarkInspectionRun(new URLSearchParams('run_id=foreign')),
    undefined
  );
});

const points = [
  { id: 11, load: 16, raw: { sequence: 0, input_tokens: 10, rate: 16 } },
  { id: 12, load: 32, raw: { sequence: 1, input_tokens: 10, rate: 32 } },
  { id: 13, load: 16, raw: { sequence: 0, input_tokens: 20, rate: 16 } }
] as StagePoint[];
const context = {
  benchmark_id: 9,
  available: true,
  reason: null,
  run_window: { start: 100, end: 500 },
  stages: [
    {
      id: '10:0',
      sequence: 0,
      input_tokens: 10,
      rate: 16,
      status: 'available',
      start: 100,
      end: 200
    },
    {
      id: '10:1',
      sequence: 1,
      input_tokens: 10,
      rate: 32,
      status: 'available',
      start: 250,
      end: 350
    },
    {
      id: '20:0',
      sequence: 0,
      input_tokens: 20,
      rate: 16,
      status: 'available',
      start: 400,
      end: 500
    }
  ],
  capabilities: { max_query_seconds: 1000 }
} as BenchmarkMonitoring;
const read = (query = '') =>
  readBenchmarkInspection(
    new URLSearchParams(`id=9&point=11&phase=10%3A0&${query}`),
    9,
    points
  );
const resolve = (query = '') =>
  resolveBenchmarkInspection(read(query), 9, points, context);
const data = {
  context,
  window: context.run_window,
  runtime: {
    metrics: {
      requests: {
        series: [
          {
            points: [
              [150, 1],
              [200, 2],
              [225, 3],
              [250, 4],
              [450, 5],
              [500, 6]
            ]
          }
        ]
      }
    }
  },
  instances: { metrics: { requests: { series: [{ points: [[151, 1]] }] } } },
  resources: null
} as unknown as BenchmarkMonitoringData;

test('old id-only links retain default selection, order, view and unpinned cursor', () => {
  assert.deepEqual(
    readBenchmarkInspection(new URLSearchParams('id=9'), 9, points),
    {
      pointId: null,
      phaseId: null,
      pointView: 'load',
      zoom: false,
      view: 'aggregate',
      latencyStatistics: ['p99'],
      cursor: null
    }
  );
});
test('full inspection roundtrips while preserving object identity and encoded display hints', () => {
  const params = new URLSearchParams('id=9&name=demo%2Fname%3F&tab=summary');
  const state = resolve('order=process&zoom=point&view=instances&cursor=151');
  const written = writeBenchmarkInspection(params, state);
  assert.equal(written.get('id'), '9');
  assert.equal(written.get('name'), 'demo/name?');
  assert.equal(written.get('tab'), 'summary');
  assert.deepEqual(readBenchmarkInspection(written, 9, points), state);
  assert.equal(
    writeBenchmarkInspection(written, { ...state, cursor: null }).has('cursor'),
    false
  );
});
test('latency multi-selection roundtrips canonically and rejects empty, unknown or ambiguous settings', () => {
  const selected = read('statistics=p99,avg,p95,avg');
  assert.deepEqual(selected.latencyStatistics, ['avg', 'p95', 'p99']);
  const written = writeBenchmarkInspection(
    new URLSearchParams('id=9'),
    selected
  );
  assert.equal(written.get('statistics'), 'avg,p95,p99');
  assert.deepEqual(
    readBenchmarkInspection(written, 9, points).latencyStatistics,
    selected.latencyStatistics
  );
  for (const query of [
    'statistics=',
    'statistics=bad',
    'statistics=avg&statistics=p95'
  ]) {
    assert.deepEqual(read(query).latencyStatistics, ['p99']);
  }
  assert.equal(
    writeBenchmarkInspection(written, {
      ...selected,
      latencyStatistics: ['p99']
    }).has('statistics'),
    false
  );
});
test('unknown points, ambiguous IDs and another benchmark cannot select an unrelated result', () => {
  for (const query of [
    'id=8&point=11',
    'id=9&id=8&point=11',
    'id=9&point=999',
    'id=9&point=11&point=12',
    'id=9&point=11e0',
    'id=9&point=-1',
    'id=9&point=9007199254740992'
  ]) {
    const parsed = readBenchmarkInspection(
      new URLSearchParams(`${query}&phase=10:0&zoom=point&cursor=150`),
      9,
      points
    );
    assert.equal(parsed.pointId, null, query);
    assert.equal(parsed.zoom, false, query);
    assert.equal(parsed.cursor, null, query);
  }
});
test('unknown phase, another result phase, missing timing and another run never restore zoom or cursor', () => {
  for (const state of [
    { ...read(), phaseId: 'unknown' },
    { ...read(), phaseId: '10:1' }
  ]) {
    const resolved = resolveBenchmarkInspection(
      { ...state, zoom: true, cursor: 150 },
      9,
      points,
      context
    );
    assert.equal(resolved.zoom, false);
    assert.equal(resolved.cursor, null);
    assert.deepEqual(benchmarkInspectionQuery(resolved, context), {
      view: 'aggregate'
    });
  }
  for (const changed of [
    { ...context, benchmark_id: 8 },
    { ...context, available: false, reason: 'historical_association_changed' },
    { ...context, stages: [{ ...context.stages[0], start: null }] }
  ]) {
    assert.equal(
      resolveBenchmarkInspection(read('zoom=point'), 9, points, changed).zoom,
      false
    );
  }
});
test('unsupported modes and malformed cursor values use defaults', () => {
  assert.equal(resolve('view=all').view, 'aggregate');
  assert.equal(resolve('order=random').pointView, 'load');
  assert.equal(resolve('zoom=all').zoom, false);
  for (const cursor of ['NaN', 'Infinity', '-1', '1e3', '150px', ''])
    assert.equal(read(`cursor=${cursor}`).cursor, null);
});
test('restored zoom requests the exact phase before runtime queries and respects query maximum', () => {
  assert.deepEqual(benchmarkInspectionQuery(resolve('zoom=point'), context), {
    view: 'aggregate',
    phase_id: '10:0'
  });
  const paged = {
    ...context,
    capabilities: { ...context.capabilities, max_query_seconds: 120 }
  };
  assert.deepEqual(benchmarkInspectionQuery(resolve('zoom=point'), paged), {
    view: 'aggregate',
    start: 100,
    end: 200
  });
  const bounded = {
    ...context,
    capabilities: { ...context.capabilities, max_query_seconds: 50 }
  };
  assert.deepEqual(benchmarkInspectionQuery(resolve('zoom=point'), bounded), {
    view: 'aggregate',
    start: 100,
    end: 150
  });
});
test('saved phase replay keeps the exact phase identity even when it exceeds the old Prometheus query limit', () => {
  const archived = {
    ...context,
    capabilities: { ...context.capabilities, max_query_seconds: 50 },
    observation_storage: {
      source: 'archive',
      run_id: 'run-a',
      content_version: 'saved-1'
    },
    query_capabilities: { phase_replay: true }
  } as BenchmarkMonitoring;
  assert.deepEqual(benchmarkInspectionQuery(resolve('zoom=point'), archived), {
    view: 'aggregate',
    phase_id: '10:0'
  });
});

test('current archive scope is revalidated after repair while live pagination is preserved', () => {
  const archive = {
    ...context,
    observation_storage: {
      source: 'archive',
      run_id: 'run-a',
      content_version: 'saved-2'
    },
    query_capabilities: { phase_replay: true }
  } as BenchmarkMonitoring;
  const fallback = { view: 'instances' };
  const previous = { phase_id: '10:0', start: 100, end: 200 };
  const inspected = resolve('view=instances');
  const repaired = {
    ...archive,
    stages: archive.stages.filter((phase) => phase.id !== '10:0')
  };
  assert.deepEqual(
    benchmarkInspectionQuery(inspected, repaired, previous),
    fallback
  );
  assert.deepEqual(benchmarkInspectionQuery(inspected, archive, previous), {
    ...previous,
    ...fallback
  });
  assert.deepEqual(
    benchmarkInspectionQuery(inspected, archive, { start: 100, end: 150 }),
    fallback
  );
  assert.deepEqual(
    benchmarkInspectionQuery(inspected, context, { start: 100, end: 150 }),
    { start: 100, end: 150, ...fallback }
  );
});

test('cursor requires an exact visible sample and cannot borrow another phase or input workload', () => {
  const cursor = (time: number, query = '') =>
    benchmarkInspectionCursor(
      resolve(`cursor=${time}&${query}`),
      points,
      points[0],
      data
    );
  assert.equal(cursor(150), 150);
  assert.equal(cursor(151), null, 'no nearest sample substitution');
  assert.equal(cursor(225), null, 'gap between visible load segments');
  assert.equal(cursor(450), null, 'another input workload');
  assert.equal(cursor(250), 250, 'the next load segment starts here');
  assert.equal(cursor(200, 'zoom=point'), null, 'phase end is exclusive');
  assert.equal(
    cursor(250, 'zoom=point'),
    null,
    'zoom cannot borrow next phase'
  );
  assert.equal(cursor(500, 'order=process'), null, 'run end is exclusive');
  assert.equal(cursor(151, 'view=instances'), 151);
  assert.equal(cursor(150, 'view=instances'), null);
  assert.equal(
    benchmarkInspectionCursor(
      resolve('cursor=150&zoom=point'),
      points,
      points[0],
      { ...data, window: { start: 160, end: 200 } }
    ),
    null
  );
});

test('an exact finite lower bound restores its cursor when the quantile value is null', () => {
  const bounded = {
    ...data,
    runtime: {
      metrics: {
        latency: {
          status: 'restricted',
          series: [{ points: [[150, null]], lower_bounds: [[150, 500]] }]
        }
      }
    }
  } as unknown as BenchmarkMonitoringData;
  assert.equal(
    benchmarkInspectionCursor(
      resolve('cursor=150'),
      points,
      points[0],
      bounded
    ),
    150
  );
  assert.equal(
    benchmarkInspectionCursor(
      resolve('cursor=151'),
      points,
      points[0],
      bounded
    ),
    null
  );
});
