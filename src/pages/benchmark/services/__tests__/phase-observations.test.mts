import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
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
let expanded = false;
const response = (query: any) => ({
  available: true,
  start: query.phase_id === '0:1' ? 20 : 10,
  end: expanded ? 100 : query.phase_id === '0:1' ? 30 : 20,
  phase_id: query.phase_id,
  metrics: {},
  sample_statistics: {}
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryBenchmarkPhaseObservations: async (
      id: number,
      query: any,
      signal: AbortSignal
    ) => {
      calls.push({ id, query, signal });
      return {
        phases: Object.fromEntries(
          query.phase_ids.split(',').map((phase_id: string) => {
            const data = response({ phase_id });
            return [phase_id, { runtime: data, resources: data }];
          })
        )
      };
    }
  }
});
const { default: usePhaseObservations } =
  await import('../use-phase-observations');
let hook: ReturnType<typeof usePhaseObservations>;
const Harness = ({ token }: { token: number }) => {
  hook = usePhaseObservations(9, token);
  return null;
};
const phase = (sequence: number) =>
  ({
    id: `0:${sequence}`,
    sequence,
    input_tokens: null,
    start: 10 + sequence * 10,
    end: 20 + sequence * 10
  }) as any;
const main = {
  context: { run_window: { start: 0, end: 100 } },
  runtime: { metrics: { full_run_only: {} } },
  resources: { metrics: { full_run_only: {} } },
  errors: {},
  loading: false
} as any;

test('exact phase queries are cached separately, never inherit whole-run observations and refresh explicitly', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  assert.equal(hook.get(phase(0), main).resources, null);
  await act(async () => {
    await Promise.all([hook.load(phase(0)), hook.load(phase(0))]);
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].query, { phase_ids: '0:0' });
  assert.equal(hook.get(phase(0), main).resources?.phase_id, '0:0');
  assert.equal(hook.get(phase(1), main).resources, null);
  await act(async () => {
    await hook.load(phase(1));
  });
  assert.equal(calls.length, 2);
  assert.equal(hook.get(phase(1), main).resources?.start, 20);
  await act(async () => root.render(createElement(Harness, { token: 1 })));
  assert.equal(hook.get(phase(0), main).resources?.phase_id, '0:0');
  await act(async () => {
    await hook.load(phase(0));
  });
  assert.equal(calls.length, 3);
  await act(async () => root.unmount());
});

test('an expanded phase response becomes a query failure rather than false stage statistics', async () => {
  expanded = true;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 2 })));
  await act(async () => {
    await hook.load(phase(0));
  });
  const result = hook.get(phase(0), main);
  assert.equal(result.resources, null);
  assert.ok(result.errors.resources instanceof Error);
  assert.ok(result.errors.runtime instanceof Error);
  await act(async () => root.unmount());
  expanded = false;
});

test('changed authorization or run identity invalidates cached phase resources even when its time interval is unchanged', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  const first = {
    ...main,
    context: {
      ...main.context,
      available: true,
      workers: [{ id: 7, name: 'worker-a' }]
    }
  };
  await act(async () => hook.updateContext(first.context));
  await act(async () => {
    await hook.load(phase(0));
  });
  assert.equal(hook.get(phase(0), first).resources?.phase_id, '0:0');
  const restricted = {
    ...first,
    context: { ...first.context, workers: [], resource_status: 'restricted' }
  };
  await act(async () => hook.updateContext(restricted.context));
  assert.equal(hook.get(phase(0), restricted).resources, null);
  await act(async () => hook.updateContext(null));
  assert.equal(hook.get(phase(0), first).resources, null);
  await act(async () => root.unmount());
});
