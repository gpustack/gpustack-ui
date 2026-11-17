import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { StagePoint } from '../../components/summary/metrics';
import type { BenchmarkMonitoring } from '../../config/monitoring-types';
const { monitoringComparison } =
  await import('../../utils/monitoring-comparison');
const {
  benchmarkInspectionQuery,
  readBenchmarkInspection,
  resolveBenchmarkInspection
} = await import('../../utils/inspection-url');

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
});
after(() => dom.window.close());
const calls: { kind: string; query?: any }[] = [];
const points = [
  { id: 11, raw: { sequence: 1, input_tokens: 10 } }
] as StagePoint[];
let context = {
  benchmark_id: 9,
  available: true,
  run_window: { start: 100, end: 1000 },
  stages: [
    {
      id: '10:1',
      sequence: 1,
      input_tokens: 10,
      status: 'available',
      start: 400,
      end: 450
    }
  ],
  instances: [],
  devices: [],
  workers: [],
  capabilities: { max_query_seconds: 100 }
} as unknown as BenchmarkMonitoring;
let query = 'id=9&point=11&phase=10:1&zoom=point';
const metricResponse = (params: any) => ({
  available: true,
  start: params.start ?? context.run_window?.start,
  end: params.end ?? context.run_window?.end,
  step: params.start === 300 ? 5 : 1,
  observation_storage: context.observation_storage,
  metrics: {
    throughput: {
      status: 'available',
      supported_statistics: ['rate'],
      series: [
        {
          name: 'rate',
          statistic: 'rate',
          dimensions: { role: 'decode' },
          points: [[params.start ?? context.run_window?.start, 1]]
        }
      ],
      summaries: [{ statistic: 'rate', dimensions: {}, value: 1 }]
    }
  }
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryBenchmarkMonitoring: async () => {
      calls.push({ kind: 'context' });
      return context;
    },
    queryBenchmarkMetrics: async (_id: number, params: any) => {
      calls.push({ kind: params.view, query: params });
      return {
        ...metricResponse(params),
        rate_window_seconds: params.start === 300 ? 70 : 62
      };
    },
    queryBenchmarkResourceMetrics: async (_id: number, params: any) => {
      calls.push({ kind: 'hardware', query: params });
      return metricResponse(params);
    }
  }
});
const { default: useMonitoring } = await import('../use-monitoring');
let hook: ReturnType<typeof useMonitoring>;
const Harness = () => {
  useMonitoring(9, 0, undefined, (server, current) => {
    const state = resolveBenchmarkInspection(
      readBenchmarkInspection(new URLSearchParams(query), 9, points),
      9,
      points,
      server
    );
    return state.zoom ? benchmarkInspectionQuery(state, server) : current;
  });
  return null;
};
test('a restored paged-run zoom validates server phase before the first three metric requests; rerenders add no requests', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  assert.deepEqual(
    calls.map((call) => call.kind),
    ['context', 'aggregate', 'instances', 'hardware']
  );
  for (const call of calls.slice(1)) {
    assert.equal(call.query.start, 400);
    assert.equal(call.query.end, 450);
  }
  query += '&cursor=425&view=instances&order=process';
  await act(async () => root.render(createElement(Harness)));
  assert.equal(
    calls.length,
    4,
    'URL rendering must not start another lifecycle fetch'
  );
  await act(async () => root.unmount());
});

test('a long-run comparison loads both bounded phases for every chart view', async () => {
  const original = context;
  context = {
    ...context,
    stages: [
      { ...context.stages[0], id: 'baseline', start: 100, end: 125 },
      { ...context.stages[0], id: 'selected', start: 300, end: 325 }
    ]
  };
  const root = createRoot(document.getElementById('root')!);
  const Deferred = () => {
    hook = useMonitoring(9, 0, undefined, undefined, { deferInactive: true });
    return null;
  };
  try {
    await act(async () => root.render(createElement(Deferred)));
    calls.length = 0;
    await act(async () => {
      await hook.load({
        view: 'aggregate',
        comparisonPhaseIds: ['baseline', 'selected']
      });
    });
    await act(async () => {
      await Promise.all([hook.ensureView('instances'), hook.ensureResources()]);
    });
    for (const [kind, response] of [
      ['aggregate', hook.runtime],
      ['instances', hook.instances],
      ['hardware', hook.resources]
    ] as const) {
      const requested = calls.filter((call) => call.kind === kind);
      assert.deepEqual(
        requested.map(({ query }) => [query.start, query.end]),
        [
          [100, 125],
          [300, 325]
        ],
        kind
      );
      assert.ok(
        requested.every(
          ({ query }) =>
            !('comparisonPhaseIds' in query) && query.phase_id === undefined
        )
      );
      const metric = response?.metrics.throughput;
      assert.deepEqual(metric?.series[0].points, [
        [100, 1],
        [125, null],
        [300, 1]
      ]);
      assert.deepEqual(metric?.summaries, []);
      assert.equal(response?.step, undefined);
    }
    assert.equal(hook.runtime?.rate_window_seconds, undefined);
    assert.deepEqual(hook.window, { start: 100, end: 325 });
  } finally {
    await act(async () => root.unmount());
    context = original;
  }
});

test('comparison windows retain a legal short union and split a long phase without dropping its tail', () => {
  const compare = (end: number) =>
    monitoringComparison(
      {
        ...context,
        stages: [
          { ...context.stages[0], id: 'baseline', start: 100, end: 125 },
          { ...context.stages[0], id: 'selected', start: 150, end }
        ]
      },
      ['selected', 'baseline']
    );
  assert.deepEqual(compare(175)?.ranges, [{ start: 100, end: 175 }]);
  const plan = compare(250.0005);
  assert.equal(plan?.ranges.length, 3);
  const [{ start: firstStart }, first, last] = plan!.ranges;
  assert.equal(firstStart, 100);
  assert.equal(first.start, 150);
  assert.equal(last.start, first.end);
  assert.equal(last.end, 250.0005);
  assert.ok(
    plan?.ranges.every(
      ({ start, end }) => end - start >= 0.001 && end - start <= 100
    )
  );
});

test('unknown or foreign-run phases cannot move the initial request window', async () => {
  for (const invalid of [
    'id=9&point=11&phase=missing&zoom=point',
    'id=9&point=999&phase=10:1&zoom=point',
    'id=8&point=11&phase=10:1&zoom=point'
  ]) {
    calls.length = 0;
    query = invalid;
    const root = createRoot(document.getElementById('root')!);
    await act(async () => root.render(createElement(Harness)));
    assert.equal(calls.length, 4);
    for (const call of calls.slice(1)) {
      assert.equal(call.query.start, 100, invalid);
      assert.equal(call.query.end, 200, invalid);
      assert.equal(call.query.phase_id, undefined, invalid);
    }
    await act(async () => root.unmount());
  }
});
