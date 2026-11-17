import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
const intervals = new Map<number, () => void>();
mock.method(globalThis, 'setInterval', (callback: any, delay: number) => {
  intervals.set(delay, callback);
  return 0 as any;
});
mock.method(globalThis, 'clearInterval', () => {});
after(() => {
  mock.restoreAll();
  dom.window.close();
});
mock.module(
  new URL('../../../../../request.extensions.ts', import.meta.url).href,
  {
    namedExports: { getTenantHeaders: () => ({}) }
  }
);
let modelRecord: any = { id: 7 };
let modelPromise: Promise<any> | null = null;
mock.module(new URL('../../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryModelDetail: async () => modelPromise || modelRecord,
    queryModelInstancesList: async () => ({
      items: [{ id: 12, name: 'Instance 12' }]
    })
  }
});
const request = mock.fn(async (path: string, options: any) =>
  path.endsWith('/monitoring-capabilities')
    ? {
        min_query_seconds: 300,
        max_query_seconds: 604800,
        retention_seconds: null,
        retention_known: false,
        retention_size_based: false,
        retention_source: 'unknown',
        supports_custom_range: true
      }
    : {
        start: options.params?.start || 1000,
        end: options.params?.end || 4600,
        metrics: {}
      }
);
mock.module('@umijs/max', { namedExports: { request } });
const { createRoot } = await import('react-dom/client');
const { useMonitoringData } = await import('../use-monitoring-data');
let state: ReturnType<typeof useMonitoringData>;
const Harness = () => {
  state = useMonitoringData(7, '[]');
  return null;
};

test('fixed ranges survive manual and automatic refresh without moving endpoints or refetching capabilities on every tick', async () => {
  const root = createRoot(document.getElementById('root')!);
  const runtimeCalls = () =>
    request.mock.calls.filter((call) => call.arguments[0].endsWith('/metrics'));
  const capabilitiesCalls = () =>
    request.mock.calls.filter((call) =>
      call.arguments[0].endsWith('/monitoring-capabilities')
    );
  try {
    await act(async () => root.render(createElement(Harness)));
    assert.equal(capabilitiesCalls().length, 1);
    await act(async () =>
      state.changeScope({ instanceIds: [12], view: 'instances' })
    );
    await act(async () => state.changeScope({ start: 1000, end: 4600 }));
    assert.deepEqual(runtimeCalls().at(-1)?.arguments[1].params, {
      start: 1000,
      end: 4600,
      instance_ids: '12',
      role: 'all',
      view: 'instances',
      statistic: 'avg,p50,p95,p99',
      section: 'all'
    });
    await act(async () => state.refresh());
    assert.equal(capabilitiesCalls().length, 2);
    await act(async () => intervals.get(60000)!());
    assert.equal(capabilitiesCalls().length, 2);
    assert.equal(runtimeCalls().at(-1)?.arguments[1].params.end, 4600);
    assert.equal(state.scope.start, 1000);
    assert.equal(state.scope.end, 4600);
    assert.deepEqual(state.scope.instanceIds, [12]);
    await act(async () => state.changeScope({ window: '6h' }));
    assert.equal(state.scope.start, undefined);
    assert.equal(state.scope.end, undefined);
    assert.equal(runtimeCalls().at(-1)?.arguments[1].params.window, '6h');
    assert.equal('start' in runtimeCalls().at(-1)?.arguments[1].params, false);
    assert.deepEqual(state.scope.instanceIds, [12]);
    assert.equal(state.scope.view, 'instances');
  } finally {
    await act(async () => root.unmount());
  }
});

test('PD paired views retain both roles and GPU/instance tabs recover the explicit filters', async () => {
  modelRecord = { id: 7, roles: [{ name: 'prefill' }, { name: 'decode' }] };
  request.mock.resetCalls();
  const root = createRoot(document.getElementById('root')!);
  const runtimeCalls = () =>
    request.mock.calls.filter((call) => call.arguments[0].endsWith('/metrics'));
  const resourceCalls = () =>
    request.mock.calls.filter((call) =>
      call.arguments[0].endsWith('/resource-metrics')
    );
  try {
    await act(async () => root.render(createElement(Harness)));
    await act(async () => state.changeTabScope('instances'));
    await act(async () =>
      state.changeScope({
        instanceIds: [12],
        view: 'instances'
      })
    );
    assert.equal(runtimeCalls().at(-1)?.arguments[1].params.instance_ids, '12');
    assert.equal(runtimeCalls().at(-1)?.arguments[1].params.role, 'all');
    await act(async () => state.changeTabScope('monitoring'));
    for (const calls of [runtimeCalls(), resourceCalls()]) {
      assert.equal(calls.at(-1)?.arguments[1].params.instance_ids, undefined);
      assert.equal(calls.at(-1)?.arguments[1].params.role, 'all');
    }
    assert.equal(runtimeCalls().at(-1)?.arguments[1].params.view, 'instances');
    assert.deepEqual(
      state.scope.instanceIds,
      [12],
      'the table filter is kept as a user preference'
    );
    await act(async () => state.refresh());
    assert.equal(runtimeCalls().at(-1)?.arguments[1].params.role, 'all');
    await act(async () => state.changeTabScope('gpu'));
    assert.equal(
      resourceCalls().at(-1)?.arguments[1].params.instance_ids,
      '12'
    );
    assert.equal(resourceCalls().at(-1)?.arguments[1].params.role, 'all');
    await act(async () => state.changeScope({ role: 'prefill' }));
    await act(async () => state.changeTabScope('monitoring'));
    assert.equal(runtimeCalls().at(-1)?.arguments[1].params.role, 'all');
    await act(async () => state.changeTabScope('gpu'));
    assert.equal(resourceCalls().at(-1)?.arguments[1].params.role, 'prefill');
  } finally {
    await act(async () => root.unmount());
    modelRecord = { id: 7 };
  }
});

test('monitoring queries wait for the model identity before choosing the PD population', async () => {
  let resolveModel!: (value: any) => void;
  modelPromise = new Promise((resolve) => {
    resolveModel = resolve;
  });
  request.mock.resetCalls();
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(createElement(Harness)));
    await act(async () =>
      state.changeScope({ instanceIds: [12], role: 'decode' })
    );
    assert.equal(
      request.mock.calls.filter(
        (call) => !call.arguments[0].endsWith('/monitoring-capabilities')
      ).length,
      0
    );
    await act(async () =>
      resolveModel({ id: 7, roles: [{ name: 'prefill' }, { name: 'decode' }] })
    );
    const runtime = request.mock.calls.find((call) =>
      call.arguments[0].endsWith('/metrics')
    );
    assert.equal(runtime?.arguments[1].params.role, 'all');
    assert.equal(runtime?.arguments[1].params.instance_ids, undefined);
  } finally {
    modelPromise = null;
    await act(async () => root.unmount());
  }
});

test('ordinary monitoring requests every instance while instance and GPU tabs retain their own filters', async () => {
  modelRecord = { id: 7 };
  request.mock.resetCalls();
  const root = createRoot(document.getElementById('root')!);
  const last = (suffix: string) =>
    request.mock.calls
      .filter((call) => call.arguments[0].endsWith(suffix))
      .at(-1)?.arguments[1].params;
  try {
    await act(async () => root.render(createElement(Harness)));
    await act(async () => state.changeTabScope('instances'));
    await act(async () => state.changeScope({ instanceIds: [12] }));
    assert.equal(last('/metrics').instance_ids, '12');
    await act(async () => state.changeTabScope('monitoring'));
    for (const view of ['instances', 'aggregate'] as const) {
      await act(async () => state.changeScope({ view }));
      await act(async () => state.refresh());
      assert.equal(last('/metrics').instance_ids, undefined);
      assert.equal(last('/resource-metrics').instance_ids, undefined);
      assert.equal(last('/metrics').view, view);
      assert.deepEqual(state.scope.instanceIds, [12]);
    }
    await act(async () => state.changeTabScope('gpu'));
    assert.equal(last('/resource-metrics').instance_ids, '12');
  } finally {
    await act(async () => root.unmount());
  }
});
