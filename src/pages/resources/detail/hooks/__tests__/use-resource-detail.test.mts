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
mock.method(globalThis, 'setInterval', () => 0 as any);
mock.method(globalThis, 'clearInterval', () => {});
let tenant = 'scope-a';
mock.module(
  new URL(
    '../../../../llmodels/detail/hooks/use-monitoring-data.ts',
    import.meta.url
  ).href,
  { namedExports: { tenantKey: () => tenant } }
);
let metadata: any;
let metadataError: any = null;
let defer = false;
const pending: {
  resolve: (value: any) => void;
  scope: any;
  signal: AbortSignal;
}[] = [];
const response = (scope: any, data = metadata) => ({
  worker_id: data.worker.id,
  selected_device_id: data.selected_device_id,
  devices: data.devices,
  start: scope.start ?? 1000,
  end: scope.end ?? 4600,
  metrics: {},
  available: true,
  reason: null,
  source: 'hardware'
});
mock.module(new URL('../../services/requests.ts', import.meta.url).href, {
  namedExports: {
    queryResourceDetail: async () => {
      if (metadataError) throw metadataError;
      return structuredClone(metadata);
    },
    queryResourceCapabilities: async () => ({
      min_query_seconds: 300,
      max_query_seconds: 604800,
      supports_custom_range: true
    }),
    queryHardwareMetrics: async (
      _target: any,
      scope: any,
      signal: AbortSignal
    ) =>
      defer
        ? new Promise((resolve) => pending.push({ resolve, scope, signal }))
        : response(scope)
  }
});
const { createRoot } = await import('react-dom/client');
const { useResourceDetail } = await import('../use-resource-detail');
let state: ReturnType<typeof useResourceDetail>;
let renders: any[] = [];
const Harness = () => {
  state = useResourceDetail({ kind: 'worker', id: '7' }, 'scope-a', {
    window: '1h'
  });
  renders.push({
    owner: state.detail.data?.worker.owner_principal_id,
    device: state.metrics.data?.devices[0]?.id
  });
  return null;
};
let root: ReturnType<typeof createRoot> | null = null;
const reset = async () => {
  if (root) await act(async () => root!.unmount());
  metadata = {
    worker: { id: 7, owner_principal_id: 17, cluster_id: 1 },
    selected_device_id: null,
    devices: [{ id: 'device-a', worker_id: 7 }],
    instances: []
  };
  metadataError = null;
  defer = false;
  pending.length = 0;
  tenant = 'scope-a';
  renders = [];
  root = createRoot(document.getElementById('root')!);
  await act(async () => root!.render(createElement(Harness)));
};
after(async () => {
  if (root) await act(async () => root!.unmount());
  mock.restoreAll();
  dom.window.close();
});
test('owner and stable device changes hide old metrics before replacement data arrives', async () => {
  await reset();
  assert.equal(state.metrics.data?.devices[0].id, 'device-a');
  metadata.worker.owner_principal_id = 99;
  metadata.devices = [{ id: 'device-b', worker_id: 7 }];
  defer = true;
  await act(async () => {
    await state.refresh();
  });
  assert.equal(state.detail.data?.worker.owner_principal_id, 99);
  assert.equal(state.metrics.data, null);
  assert.ok(!renders.some((r) => r.owner === 99 && r.device === 'device-a'));
  await act(async () => pending.at(-1)!.resolve(response({ window: '1h' })));
  assert.equal(state.metrics.data?.devices[0].id, 'device-b');
});
test('a metadata authorization failure clears all protected resource observations', async () => {
  await reset();
  metadataError = { response: { status: 404 } };
  await act(async () => {
    await state.refresh();
  });
  assert.equal(state.detail.data, null);
  assert.equal(state.metrics.data, null);
  assert.equal(state.capabilities.data, null);
});
test('a slower request cannot replace a newer fixed interval', async () => {
  await reset();
  defer = true;
  await act(async () => state.changeScope({ window: '3h' }));
  const old = pending.at(-1)!;
  await act(async () =>
    state.changeScope({ start: 1730000000, end: 1730003600 })
  );
  assert.equal(old.signal.aborted, true);
  const next = pending.at(-1)!;
  await act(async () => next.resolve(response(next.scope)));
  await act(async () => old.resolve(response(old.scope)));
  assert.equal(state.metrics.data?.start, 1730000000);
  assert.equal(state.metrics.data?.end, 1730003600);
});
test('tenant changes prevent a late response from publishing', async () => {
  await reset();
  defer = true;
  await act(async () => state.changeScope({ window: '6h' }));
  const next = pending.at(-1)!;
  tenant = 'scope-b';
  await act(async () => next.resolve(response(next.scope)));
  assert.equal(state.metrics.data, null);
});
