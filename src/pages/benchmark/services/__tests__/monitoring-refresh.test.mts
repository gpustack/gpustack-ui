import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
});
after(() => dom.window.close());
const calls: any[] = [];
const pending = (kind: string, id: number, params: any, signal: AbortSignal) =>
  new Promise((resolve, reject) =>
    calls.push({ kind, id, params, signal, resolve, reject })
  );
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryBenchmarkMonitoring: (id: number, signal: AbortSignal) =>
      pending('context', id, {}, signal),
    queryBenchmarkMetrics: (id: number, params: any, signal: AbortSignal) =>
      pending(params.view, id, params, signal),
    queryBenchmarkResourceMetrics: (
      id: number,
      params: any,
      signal: AbortSignal
    ) => pending('hardware', id, params, signal)
  }
});
const { default: useMonitoring } = await import('../use-monitoring');
let hook: ReturnType<typeof useMonitoring>;
const Harness = ({ token, id = 9 }: { token: number; id?: number }) => {
  hook = useMonitoring(id, token);
  return null;
};
const context = {
  benchmark_id: 9,
  available: true,
  run_window: { start: 100, end: 400 },
  stages: [{ id: '0:1', start: 200, end: 300 }],
  capabilities: { max_query_seconds: 604800 }
};
const finish = async (from: number, value = 1) => {
  await act(async () => calls[from].resolve(context));
  await act(async () => {
    for (const call of calls.slice(from + 1))
      call.resolve({ start: 100, end: 400, marker: value, metrics: {} });
  });
};

test('live refresh retains coherent loaded curves and coalesces watch ticks while a query is pending', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  await finish(0);
  assert.equal((hook.runtime as any).marker, 1);
  await act(async () => root.render(createElement(Harness, { token: 1 })));
  assert.equal(hook.loading, true);
  assert.equal(
    (hook.runtime as any)?.marker,
    1,
    'progress ticks must not turn a loaded curve into a no-data state'
  );
  assert.deepEqual(hook.window, { start: 100, end: 400 });
  const count = calls.length;
  await act(async () => root.render(createElement(Harness, { token: 2 })));
  assert.equal(
    calls.length,
    count,
    'a slow Prometheus query must not be cancelled and restarted on every tick'
  );
  assert.equal(calls[4].signal.aborted, false);
  await finish(4, 2);
  assert.equal((hook.runtime as any).marker, 2);
  await act(async () => root.unmount());
});

test('changing the requested phase clears preceding-window values and switching benchmark aborts stale replies', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  await finish(0);
  let scopeRequest: Promise<void>;
  await act(async () => {
    scopeRequest = hook.load({ phase_id: '0:1' });
  });
  assert.equal(hook.runtime, null);
  assert.equal(hook.window, null);
  await act(async () =>
    root.render(createElement(Harness, { token: 0, id: 10 }))
  );
  assert.equal(calls[4].signal.aborted, true);
  await act(async () => calls[4].resolve(context));
  await scopeRequest!;
  assert.equal(hook.runtime, null);
  assert.equal(
    calls.filter((call) => call.id === 9 && call.kind === 'aggregate').length,
    1
  );
  await act(async () => root.unmount());
});

test('known missing historical identities do not launch unusable engine and hardware queries', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  await act(async () =>
    calls[0].resolve({
      ...context,
      available: false,
      reason: 'historical_association_unavailable'
    })
  );
  assert.equal(calls.length, 1);
  assert.equal(hook.loading, false);
  assert.equal(hook.context?.reason, 'historical_association_unavailable');
  assert.equal(hook.runtime, null);
  assert.deepEqual(hook.window, { start: 100, end: 400 });
  await act(async () => root.unmount());
});

test('a terminal watch tick during a pending query triggers one trailing snapshot refresh', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  await finish(0);
  await act(async () => root.render(createElement(Harness, { token: 1 })));
  await act(async () => calls[4].resolve(context));
  await act(async () => root.render(createElement(Harness, { token: 2 })));
  await act(async () => {
    for (const call of calls.slice(5, 8))
      call.resolve({ start: 100, end: 400, marker: 2, metrics: {} });
  });
  assert.equal(
    calls[8]?.kind,
    'context',
    'completion must not swallow the final expanded run interval'
  );
  await act(async () =>
    calls[8].resolve({ ...context, run_window: { start: 100, end: 500 } })
  );
  await act(async () => {
    for (const call of calls.slice(9, 12))
      call.resolve({ start: 100, end: 500, marker: 3, metrics: {} });
  });
  assert.deepEqual(hook.window, { start: 100, end: 500 });
  assert.equal((hook.runtime as any).marker, 3);
  assert.equal(calls.length, 12);
  await act(async () => root.unmount());
});

for (const status of [401, 403, 404]) {
  test(`an authorization response ${status} clears protected observations`, async () => {
    calls.length = 0;
    const root = createRoot(document.getElementById('root')!);
    await act(async () => root.render(createElement(Harness, { token: 0 })));
    await finish(0);
    await act(async () => root.render(createElement(Harness, { token: 1 })));
    await act(async () => calls[4].reject({ response: { status } }));
    assert.equal(hook.runtime, null);
    assert.equal(hook.resources, null);
    await act(async () => root.unmount());
  });
}

test('a changed visible resource population clears preceding observations before metric replies', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  await act(async () =>
    calls[0].resolve({ ...context, workers: [{ id: 7, name: 'worker-a' }] })
  );
  await act(async () => {
    for (const call of calls.slice(1, 4))
      call.resolve({
        start: 100,
        end: 400,
        marker: 'restricted-later',
        metrics: {}
      });
  });
  await act(async () => root.render(createElement(Harness, { token: 1 })));
  await act(async () =>
    calls[4].resolve({ ...context, workers: [], resource_status: 'restricted' })
  );
  assert.equal(hook.runtime, null);
  assert.equal(hook.resources, null);
  assert.deepEqual(hook.context?.workers, []);
  await act(async () => root.unmount());
});

test('effect replay never coalesces a new mount into its aborted predecessor', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(StrictMode, null, createElement(Harness, { token: 0 }))
    )
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].signal.aborted, true);
  await act(async () => calls[0].resolve(context));
  assert.equal(calls.length, 2);
  await finish(1, 2);
  assert.equal(hook.loading, false);
  assert.equal((hook.runtime as any).marker, 2);
  await act(async () => root.unmount());
});
