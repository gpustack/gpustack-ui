import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, afterEach, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  BenchmarkObservationStorage,
  BenchmarkPhase
} from '../../config/monitoring-types';

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
});
after(() => dom.window.close());
const storage: BenchmarkObservationStorage = {
  source: 'archive',
  run_id: 'saved-run',
  content_version: 'saved-3',
  archive_state: 'ready',
  capture_complete: true,
  data_coverage: 'complete'
};
const context = {
  benchmark_id: 9,
  available: true,
  model_id: null,
  run_window: { start: 100, end: 400 },
  stages: [] as Pick<BenchmarkPhase, 'id' | 'start' | 'end' | 'status'>[],
  workers: [{ id: 7, name: 'deleted-worker' }],
  instances: [],
  devices: [],
  observation_storage: storage,
  query_capabilities: { run_replay: true, phase_replay: true },
  capabilities: { max_query_seconds: 100 }
};
const calls: any[] = [];
let mismatched = false;
let currentContext = context;
let contextError: any = null;
let contextReplacement: typeof context | null = null;
let metricError: any = null;
let replacementContext: typeof context | null = null;
afterEach(() => {
  currentContext = context;
  contextError = metricError = null;
  replacementContext = contextReplacement = null;
  mismatched = false;
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryBenchmarkMonitoring: async (
      _id: number,
      _signal: AbortSignal,
      params: any
    ) => {
      calls.push({ kind: 'context', params });
      if (contextError) {
        const error = contextError;
        if (contextReplacement) {
          currentContext = contextReplacement;
          contextReplacement = contextError = null;
        }
        throw error;
      }
      return currentContext;
    },
    queryBenchmarkMetrics: async (_id: number, params: any) => {
      calls.push({ kind: params.view, params });
      if (metricError) {
        const error = metricError;
        if (replacementContext) {
          currentContext = replacementContext;
          replacementContext = metricError = null;
        }
        throw error;
      }
      return {
        available: true,
        metrics: {},
        observation_storage: {
          ...currentContext.observation_storage,
          content_version: mismatched
            ? 'saved-4'
            : currentContext.observation_storage.content_version
        }
      };
    },
    queryBenchmarkResourceMetrics: async (_id: number, params: any) => {
      calls.push({ kind: 'resources', params });
      return {
        available: true,
        metrics: {},
        observation_storage: currentContext.observation_storage
      };
    }
  }
});
const { default: useMonitoring } = await import('../use-monitoring');
let hook: ReturnType<typeof useMonitoring>;
const Harness = ({
  token,
  deferred = false,
  runId,
  reportRunId
}: {
  token: number;
  deferred?: boolean;
  runId?: string;
  reportRunId?: string | null;
}) => {
  hook = useMonitoring(9, token, undefined, undefined, {
    deferInactive: deferred,
    runId,
    reportRunId
  });
  return null;
};

test('saved context replays deleted resources, pins every request and remains immutable on watch ticks', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  assert.equal(hook.runtime?.available, true);
  assert.deepEqual(hook.window, context.run_window);
  for (const { params } of calls.slice(1)) {
    assert.equal(params.run_id, 'saved-run');
    assert.equal(params.content_version, 'saved-3');
    assert.equal(
      params.start,
      undefined,
      'whole saved run must not become a custom summary range'
    );
  }
  const count = calls.length;
  await act(async () => root.render(createElement(Harness, { token: 1 })));
  assert.equal(calls.length, count);
  await act(async () => {
    await hook.load({ phase_id: 'phase-1' });
  });
  assert.deepEqual(calls[count].params, { run_id: 'saved-run' });
  await act(async () => root.unmount());
});

test('a live comparison switches to a version-pinned whole run when archived', async () => {
  const stages = [
    { id: 'baseline', start: 100, end: 125, status: 'available' },
    { id: 'selected', start: 300, end: 325, status: 'available' }
  ];
  currentContext = {
    ...context,
    stages,
    observation_storage: { ...storage, source: 'live', content_version: null }
  };
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(createElement(Harness, { token: 0 })));
    calls.length = 0;
    await act(async () => {
      await hook.load({
        view: 'aggregate',
        comparisonPhaseIds: ['baseline', 'selected']
      });
    });
    for (const kind of ['aggregate', 'instances', 'resources']) {
      assert.deepEqual(
        calls
          .filter((call) => call.kind === kind)
          .map(({ params }) => [params.start, params.end]),
        [
          [100, 125],
          [300, 325]
        ],
        kind
      );
    }
    currentContext = { ...context, stages };
    calls.length = 0;
    await act(async () => {
      await hook.refresh();
    });
    assert.deepEqual(
      calls.map(({ kind }) => kind),
      ['context', 'aggregate', 'instances', 'resources']
    );
    for (const { params } of calls.slice(1)) {
      assert.equal(params.run_id, 'saved-run');
      assert.equal(params.content_version, 'saved-3');
      assert.equal(params.phase_id, undefined);
      assert.equal(params.start, undefined);
      assert.equal(params.end, undefined);
      assert.ok(!('comparisonPhaseIds' in params));
    }
    assert.deepEqual(hook.window, context.run_window);
    assert.deepEqual(hook.errors, {});
  } finally {
    await act(async () => root.unmount());
  }
});

test('a response from a different saved version is a query error and is never combined with saved resources', async () => {
  mismatched = true;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  assert.equal(hook.runtime, null);
  assert.ok(hook.errors.runtime instanceof Error);
  assert.equal(hook.resources?.available, true);
  await act(async () => root.unmount());
  mismatched = false;
});

test('inactive instance and hardware curves load on demand with the same pinned scope', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(createElement(Harness, { token: 0, deferred: true }))
  );
  assert.deepEqual(
    calls.map((call) => call.kind),
    ['context', 'aggregate']
  );
  assert.equal(hook.instances, null);
  assert.equal(hook.resources, null);
  await act(async () => {
    await Promise.all([
      hook.ensureView('instances'),
      hook.ensureView('instances')
    ]);
  });
  assert.equal(calls.length, 3);
  assert.equal(calls[2].kind, 'instances');
  await act(async () => {
    await hook.ensureResources();
  });
  assert.equal(calls.length, 4);
  assert.equal(calls[3].params.content_version, 'saved-3');
  await act(async () => {
    await hook.ensureView('aggregate');
  });
  assert.equal(calls.length, 4, 'switching back reuses the loaded aggregate');
  await act(async () => root.unmount());
});

test('a new execution of the same Benchmark clears the prior saved monitoring content', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(createElement(Harness, { token: 0, runId: 'saved-run' }))
  );
  const count = calls.length;
  await act(async () =>
    root.render(createElement(Harness, { token: 0, runId: 'next-run' }))
  );
  assert.equal(calls[count]?.kind, 'context');
  assert.equal(calls[count]?.params.run_id, 'next-run');
  assert.equal(calls[count]?.params.content_version, undefined);
  assert.equal(
    hook.runtime,
    null,
    'a server still returning the previous run cannot populate the new execution'
  );
  await act(async () => root.unmount());
});

test('saved monitoring reuses its successful views across context refresh and resource expansion', async () => {
  calls.length = 0;
  currentContext = {
    ...context,
    observation_storage: {
      ...storage,
      content_version: 'saved-2',
      archive_state: 'partial',
      capture_complete: false
    }
  };
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(createElement(Harness, { token: 0, deferred: true }))
  );
  await act(async () => {
    await hook.refresh();
  });
  await act(async () => {
    await hook.ensureResources();
  });
  assert.equal(calls.filter((call) => call.kind === 'context').length, 2);
  assert.equal(calls.filter((call) => call.kind === 'aggregate').length, 1);
  assert.equal(calls.filter((call) => call.kind === 'resources').length, 1);
  currentContext = {
    ...context,
    observation_storage: { ...storage, content_version: 'saved-3' }
  };
  await act(async () => {
    await hook.refresh();
  });
  assert.equal(hook.runtime?.observation_storage?.content_version, 'saved-3');
  assert.equal(calls.filter((call) => call.kind === 'aggregate').length, 2);
  await act(async () => root.unmount());
  currentContext = context;
});

test('manual refresh still checks archive permissions and clears all cached observations on revocation', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  assert.ok(hook.runtime);
  contextError = { response: { status: 403 } };
  await act(async () => {
    await hook.refresh();
  });
  assert.equal(hook.runtime, null);
  assert.equal(hook.resources, null);
  assert.equal(hook.context, null);
  contextError = null;
  await act(async () => root.unmount());
});

test('an archive awaiting its first run window does not issue premature curve requests', async () => {
  calls.length = 0;
  currentContext = {
    ...context,
    run_window: null,
    observation_storage: {
      ...storage,
      content_version: 'saved-1',
      archive_state: 'capturing',
      capture_complete: false
    }
  } as any;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  assert.deepEqual(
    calls.map((call) => call.kind),
    ['context']
  );
  assert.deepEqual(hook.errors, {});
  await act(async () => root.unmount());
  currentContext = context;
});

test('a write during replay refreshes context and retries the same phase as one batch', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  metricError = {
    response: {
      status: 409,
      data: { details: { code: 'benchmark_archive_content_changed' } }
    }
  };
  await act(async () => {
    await hook.load({ phase_id: 'phase-1' });
  });
  assert.ok(
    hook.errors.runtime,
    'a continuously conflicting read stops retrying'
  );
  assert.equal(
    calls.filter(
      (call) => call.kind === 'aggregate' && call.params.phase_id === 'phase-1'
    ).length,
    2
  );
  assert.equal(hook.runtime, null);
  assert.ok(hook.resources);
  metricError = null;
  currentContext = {
    ...context,
    observation_storage: { ...storage, content_version: 'saved-4' }
  };
  await act(async () => {
    await hook.refresh();
  });
  assert.equal(hook.runtime?.observation_storage?.content_version, 'saved-4');
  assert.equal(hook.resources?.observation_storage?.content_version, 'saved-4');
  assert.equal(calls.at(-1)?.params.phase_id, 'phase-1');
  await act(async () => root.unmount());
});

test('context read retries a concurrent archive replacement once before loading curves', async () => {
  calls.length = 0;
  const conflict = {
    response: {
      status: 409,
      data: { details: { code: 'benchmark_archive_content_changed' } }
    }
  };
  contextError = conflict;
  contextReplacement = {
    ...context,
    observation_storage: { ...storage, content_version: 'saved-4' }
  };
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(createElement(Harness, { token: 0 })));
    assert.deepEqual(
      calls.map(({ kind }) => kind),
      ['context', 'context', 'aggregate', 'instances', 'resources']
    );
    assert.deepEqual(hook.errors, {});
    assert.equal(hook.runtime?.observation_storage?.content_version, 'saved-4');

    const count = calls.length;
    contextError = conflict;
    await act(async () => {
      await hook.load({ phase_id: 'phase-2' });
    });
    assert.deepEqual(
      calls.slice(count).map(({ kind }) => kind),
      ['context', 'context']
    );
    assert.equal(hook.runtime, null);
    assert.equal(hook.errors.context, conflict);
  } finally {
    await act(async () => root.unmount());
  }
});

test('a repaired archive replays one coherent generation without an old URL pin', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness, { token: 0 })));
  replacementContext = {
    ...context,
    observation_storage: { ...storage, content_version: 'saved-4' }
  };
  metricError = {
    response: {
      status: 409,
      data: { details: { code: 'benchmark_archive_content_changed' } }
    }
  };
  await act(async () => {
    await hook.load({ phase_id: 'phase-2', view: 'instances' });
  });
  assert.deepEqual(hook.errors, {});
  assert.equal(hook.context?.observation_storage?.content_version, 'saved-4');
  assert.equal(hook.runtime?.observation_storage?.content_version, 'saved-4');
  assert.equal(hook.instances?.observation_storage?.content_version, 'saved-4');
  assert.equal(hook.resources?.observation_storage?.content_version, 'saved-4');
  assert.equal(calls.at(-1)?.params.phase_id, 'phase-2');
  assert.ok(
    calls
      .filter((call) => call.kind === 'context')
      .every(({ params }) => params.content_version === undefined)
  );
  await act(async () => root.unmount());
});

test('a URL execution belonging to a different client report clears monitoring before requesting the foreign archive', async () => {
  calls.length = 0;
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(Harness, {
        token: 0,
        runId: 'saved-run',
        reportRunId: 'saved-run'
      })
    )
  );
  assert.ok(hook.runtime);
  const count = calls.length;
  await act(async () =>
    root.render(
      createElement(Harness, {
        token: 0,
        runId: 'saved-run',
        reportRunId: 'replacement-run'
      })
    )
  );
  assert.equal(calls.length, count);
  assert.equal(hook.runtime, null);
  assert.equal(hook.context, null);
  assert.equal((hook.errors.context as any)?.code, 'benchmark_run_changed');
  await act(async () => root.unmount());
});

test('a validated link can identify a saved execution', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(Harness, {
        token: 0,
        runId: 'saved-run',
        reportRunId: null
      })
    )
  );
  assert.ok(hook.runtime);
  assert.equal(hook.errors.context, undefined);
  await act(async () => root.unmount());
});
