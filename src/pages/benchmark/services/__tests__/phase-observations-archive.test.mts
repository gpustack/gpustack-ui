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
const storage = {
  source: 'archive',
  run_id: 'run-a',
  content_version: 'saved-2',
  archive_state: 'ready',
  capture_complete: true
};
const calls: any[] = [];
let status = 0;
let contentVersion = 'saved-2';
let hardwareAllowed = true;
let errorDetails: any = undefined;
const phase = (sequence: number) =>
  ({
    id: `0:${sequence}`,
    sequence,
    start: 10 + sequence * 10,
    end: 20 + sequence * 10
  }) as any;
const metric = (item: any) => ({
  available: true,
  phase_id: item.id,
  start: item.start,
  end: item.end,
  metrics: {},
  observation_storage: storage,
  sample_statistics: {
    kv_usage: [
      {
        dimensions: {},
        peak: 0,
        peak_at: item.start,
        observed_samples: 1,
        expected_samples: 1,
        average: 0,
        last: null,
        last_at: null,
        threshold: 90,
        threshold_fraction: 0,
        coverage: 1
      }
    ]
  }
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryBenchmarkPhaseObservations: async (_id: number, params: any) => {
      calls.push({ kind: 'batch', params });
      if (status)
        throw { response: { status, data: { details: errorDetails } } };
      return {
        run_id: 'run-a',
        content_version: contentVersion,
        phases: Object.fromEntries(
          params.phase_ids.split(',').map((id: string) => {
            const item = phase(Number(id.split(':')[1]));
            return [
              id,
              {
                runtime: metric(item),
                resources: hardwareAllowed ? metric(item) : null
              }
            ];
          })
        )
      };
    },
    queryBenchmarkMetrics: async () => {
      calls.push({ kind: 'legacy' });
      return {};
    },
    queryBenchmarkResourceMetrics: async () => {
      calls.push({ kind: 'legacy' });
      return {};
    }
  }
});
const { default: usePhaseObservations } =
  await import('../use-phase-observations');
let hook: ReturnType<typeof usePhaseObservations>;
const Harness = ({
  token = 0,
  refresh
}: {
  token?: number;
  refresh?: () => void;
}) => {
  hook = usePhaseObservations(9, token, refresh);
  return null;
};
const main = {
  context: { available: true, observation_storage: storage },
  errors: {}
} as any;

test('selected and baseline observations share one pinned summary batch without requesting phase curves', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  await act(async () => hook.updateContext(main.context));
  await act(async () => {
    await Promise.all([
      hook.load(phase(0)),
      hook.load(phase(1)),
      hook.load(phase(0))
    ]);
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].params, {
    phase_ids: '0:0,0:1',
    run_id: 'run-a',
    content_version: 'saved-2'
  });
  assert.equal(
    hook.get(phase(0), main).runtime?.sample_statistics?.kv_usage[0].peak,
    0
  );
  await act(async () => root.render(createElement(Harness, { token: 1 })));
  await act(async () => {
    await hook.loadAll([phase(0), phase(1)]);
  });
  assert.equal(
    calls.length,
    1,
    'completed saved summaries remain cached across watch updates'
  );
  await act(async () => root.unmount());
});

test('batch content conflicts and permission errors remain failures without retrying through live queries', async () => {
  for (const failure of ['content', 'permission']) {
    calls.length = 0;
    contentVersion = failure === 'content' ? 'saved-3' : 'saved-2';
    status = failure === 'permission' ? 403 : 0;
    const root = createRoot(document.getElementById('root')!);
    await act(async () => root.render(createElement(Harness)));
    await act(async () => hook.updateContext(main.context));
    await act(async () => {
      await hook.load(phase(0));
    });
    assert.equal(calls.length, 1);
    assert.equal(hook.get(phase(0), main).runtime, null);
    assert.ok(hook.get(phase(0), main).errors.runtime);
    await act(async () => root.unmount());
  }
  contentVersion = 'saved-2';
  status = 0;
});

test('a large comparison loads bounded summary batches instead of downloading per-phase curves', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  await act(async () => hook.updateContext(main.context));
  await act(async () => {
    await hook.loadAll(
      Array.from({ length: 120 }, (_, sequence) => phase(sequence))
    );
  });
  assert.equal(calls.length, 3);
  assert.deepEqual(
    calls.map((call) => call.params.phase_ids.split(',').length),
    [50, 50, 20]
  );
  assert.ok(calls.every((call) => call.kind === 'batch'));
  await act(async () => root.unmount());
});

test('restricted historical hardware keeps authorized runtime summaries available', async () => {
  hardwareAllowed = false;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  const restricted = {
    ...main,
    context: { ...main.context, resource_status: 'restricted' }
  };
  await act(async () => hook.updateContext(restricted.context));
  await act(async () => {
    await hook.load(phase(0));
  });
  const result = hook.get(phase(0), restricted);
  assert.equal(result.runtime?.sample_statistics?.kv_usage[0].peak, 0);
  assert.equal(result.resources, null);
  assert.equal(result.errors.runtime, undefined);
  await act(async () => root.unmount());
  hardwareAllowed = true;
});

test('a failed published phase summary remains retryable instead of becoming an immutable cached error', async () => {
  calls.length = 0;
  status = 503;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  await act(async () => hook.updateContext(main.context));
  await act(async () => {
    await hook.load(phase(0));
  });
  status = 0;
  await act(async () => {
    await hook.load(phase(0));
  });
  assert.equal(calls.length, 2);
  assert.equal(
    hook.get(phase(0), main).runtime?.sample_statistics?.kv_usage[0].peak,
    0
  );
  await act(async () => root.unmount());
});

test('changed archive content requests one context refresh instead of mixing phase summaries', async () => {
  status = 409;
  errorDetails = { code: 'benchmark_archive_content_changed' };
  let refreshes = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(createElement(Harness, { refresh: () => refreshes++ }))
  );
  await act(async () => hook.updateContext(main.context));
  await act(async () => {
    await hook.loadAll([phase(0), phase(1)]);
  });
  assert.equal(refreshes, 1);
  assert.equal(hook.get(phase(0), main).runtime, null);
  assert.equal(hook.get(phase(1), main).runtime, null);
  await act(async () => {
    await hook.load(phase(0));
  });
  assert.equal(refreshes, 1, 'the same conflicting version does not loop');
  status = 0;
  errorDetails = undefined;
  await act(async () => root.unmount());
});
