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
mock.module(new URL('../../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryModelDetail: async () => ({ id: 7 }),
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
