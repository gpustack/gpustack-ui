import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import type {
  CacheProviderItem,
  CacheServiceInstanceItem,
  ListItem
} from '../../config/types';

const calls = {
  queryCacheServiceDetail: mock.fn<(...args: any[]) => Promise<any>>(),
  queryCacheServiceInstances: mock.fn<(...args: any[]) => Promise<any>>(),
  queryCacheProviders: mock.fn<(...args: any[]) => Promise<any>>(),
  queryWorkersList: mock.fn<(...args: any[]) => Promise<any>>(),
  deleteCacheServiceInstance: mock.fn<(...args: any[]) => Promise<any>>()
};
const warning = mock.fn();
const formatMessage = (
  { id }: { id: string },
  values?: Record<string, unknown>
) => JSON.stringify({ id, values });

mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage }) }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (callback: unknown) => callback }
});
mock.module('@gpustack/core-ui', {
  namedExports: { IconFont: () => null, GrafanaIcon: () => null, icons: {} }
});
mock.module('antd', { namedExports: { message: { warning } } });
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryCacheServiceDetail: calls.queryCacheServiceDetail,
    queryCacheServiceInstances: calls.queryCacheServiceInstances,
    queryCacheProviders: calls.queryCacheProviders,
    deleteCacheServiceInstance: calls.deleteCacheServiceInstance
  }
});
mock.module(new URL('../../../resources/apis/index.ts', import.meta.url).href, {
  namedExports: { queryWorkersList: calls.queryWorkersList }
});

// Keep the placement evaluator and its reservation accounting real.
const { default: useRecreateInstance } =
  await import('../use-recreate-instance');

const GiB = 1024 ** 3;
const provider: CacheProviderItem = {
  name: 'test-cache',
  display_name: 'Test Cache',
  source: 'built_in',
  topology: 'replicas',
  versions: { '1.0.0': { image: 'test:1' }, '2.0.0': { image: 'test:2' } },
  fields: [{ name: 'ram_size', default: 15 }],
  resource_profile: { ram_gib: '{{ram_size}}' },
  inference_backend_integrations: []
};
const service = {
  id: 1,
  name: 'cache',
  provider_name: provider.name,
  provider_version: '2.0.0',
  cluster_id: 3,
  worker_id: 7,
  config: { fields: { ram_size: 15 } }
} as ListItem;
const target = {
  id: 10,
  cache_service_id: service.id,
  worker_id: 7,
  cluster_id: 3,
  component: '',
  computed_resource_claim: { ram: 15 * GiB }
} as CacheServiceInstanceItem;
const sibling = {
  ...target,
  id: 11,
  component: 'other',
  computed_resource_claim: { ram: 4 * GiB }
};
const worker = {
  id: 7,
  name: 'worker-7',
  labels: {},
  system_reserved: { ram: GiB },
  status: {
    memory: { total: 20 * GiB, allocated: 19 * GiB, used: 19 * GiB },
    gpu_devices: []
  }
};
const unavailable = formatMessage({ id: 'kvCache.check.recreate.unavailable' });

function harness() {
  for (const call of Object.values(calls)) call.mock.resetCalls();
  warning.mock.resetCalls();
  calls.queryCacheServiceDetail.mock.mockImplementation(async () => service);
  calls.queryCacheServiceInstances.mock.mockImplementation(async () => ({
    items: [target, sibling]
  }));
  calls.queryCacheProviders.mock.mockImplementation(async () => ({
    items: [provider]
  }));
  calls.queryWorkersList.mock.mockImplementation(async () => ({
    items: [worker]
  }));
  calls.deleteCacheServiceInstance.mock.mockImplementation(
    async () => undefined
  );
  const show = mock.fn<(options: any) => void>();
  const onSuccess = mock.fn();
  const controller = useRecreateInstance({
    modalRef: { current: { show } },
    onSuccess
  });
  const open = (initialService = service, initialInstance = target) => {
    controller.handleRecreateInstance(
      initialService,
      initialInstance,
      worker.name
    );
    return show.mock.calls.at(-1)!.arguments[0];
  };
  return { open, onSuccess };
}

test('confirmation refreshes the saved spec, exact target reservation, provider and workers before deleting', async () => {
  const h = harness();
  const confirmation = h.open(
    { ...service, config: { fields: { ram_size: 99 } } },
    { ...target, computed_resource_claim: { ram: GiB } }
  );
  assert.equal(calls.queryCacheServiceDetail.mock.callCount(), 0);
  assert.equal(calls.deleteCacheServiceInstance.mock.callCount(), 0);
  assert.equal(confirmation.showSuccess, false);

  let resolveWorkers!: (value: any) => void;
  calls.queryWorkersList.mock.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveWorkers = resolve;
      })
  );
  const confirmed = confirmation.onOk();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(calls.deleteCacheServiceInstance.mock.callCount(), 0);
  assert.equal(h.onSuccess.mock.callCount(), 0);
  resolveWorkers({ items: [worker] });
  await confirmed;

  assert.deepEqual(calls.queryCacheServiceDetail.mock.calls[0].arguments, [
    1,
    { skipErrorHandler: true }
  ]);
  assert.deepEqual(calls.queryCacheServiceInstances.mock.calls[0].arguments, [
    1,
    { skipErrorHandler: true }
  ]);
  assert.deepEqual(calls.queryCacheProviders.mock.calls[0].arguments, [
    { page: -1 },
    { skipErrorHandler: true }
  ]);
  assert.deepEqual(calls.queryWorkersList.mock.calls[0].arguments, [
    { cluster_id: 3, page: -1 },
    { skipErrorHandler: true }
  ]);
  assert.deepEqual(
    calls.deleteCacheServiceInstance.mock.calls[0].arguments,
    [1, 10]
  );
  assert.equal(h.onSuccess.mock.callCount(), 1);
  assert.equal(warning.mock.callCount(), 0);
});

test('every confirmation fetches current resources, including a retry after an earlier successful request', async () => {
  const h = harness();
  await h.open().onOk();
  calls.queryCacheServiceDetail.mock.mockImplementation(async () => ({
    ...service,
    config: { fields: { ram_size: 16 } }
  }));
  await assert.rejects(h.open().onOk());
  for (const name of [
    'queryCacheServiceDetail',
    'queryCacheServiceInstances',
    'queryCacheProviders',
    'queryWorkersList'
  ] as const) {
    assert.equal(calls[name].mock.callCount(), 2, name);
  }
  assert.equal(calls.deleteCacheServiceInstance.mock.callCount(), 1);
  assert.equal(h.onSuccess.mock.callCount(), 1);
});

test('insufficient replacement RAM blocks deletion and does not reclaim sibling reservations', async () => {
  const h = harness();
  calls.queryCacheServiceDetail.mock.mockImplementation(async () => ({
    ...service,
    config: { fields: { ram_size: 16 } }
  }));
  await assert.rejects(h.open().onOk());
  assert.equal(calls.deleteCacheServiceInstance.mock.callCount(), 0);
  assert.equal(h.onSuccess.mock.callCount(), 0);
  assert.equal(
    warning.mock.calls[0].arguments[0],
    formatMessage(
      { id: 'kvCache.check.recreate.insufficientRam' },
      { worker: worker.name, required: 16, available: 15 }
    )
  );
});

test('auto placement checks the worker selected after deletion instead of reclaiming RAM on the old worker', async () => {
  const h = harness();
  const autoService = { ...service, worker_id: undefined };
  const autoTarget = { ...target, worker_id: 2 };
  const firstWorker = { ...worker, id: 1, name: 'worker-1' };
  const oldWorker = {
    ...worker,
    id: 2,
    name: 'worker-2',
    status: {
      ...worker.status,
      memory: { total: 20 * GiB, allocated: 15 * GiB, used: 15 * GiB }
    }
  };
  calls.queryCacheServiceDetail.mock.mockImplementation(
    async () => autoService
  );
  calls.queryCacheServiceInstances.mock.mockImplementation(async () => ({
    items: [autoTarget]
  }));
  calls.queryWorkersList.mock.mockImplementation(async () => ({
    items: [firstWorker, oldWorker]
  }));

  await assert.rejects(h.open(autoService, autoTarget).onOk());
  assert.equal(calls.deleteCacheServiceInstance.mock.callCount(), 0);
  assert.equal(h.onSuccess.mock.callCount(), 0);
  assert.equal(
    warning.mock.calls[0].arguments[0],
    formatMessage(
      { id: 'kvCache.check.recreate.insufficientRam' },
      { worker: firstWorker.name, required: 15, available: 0 }
    )
  );
});

test('a per-node instance outside the latest selector can be removed when no replacement is needed', async () => {
  const h = harness();
  const cleanupService = {
    ...service,
    worker_id: undefined,
    worker_selector: { pool: 'new' }
  };
  calls.queryCacheServiceDetail.mock.mockImplementation(
    async () => cleanupService
  );
  calls.queryCacheServiceInstances.mock.mockImplementation(async () => ({
    items: [target]
  }));
  calls.queryCacheProviders.mock.mockImplementation(async () => ({
    items: [{ ...provider, topology: 'per_node' }]
  }));
  calls.queryWorkersList.mock.mockImplementation(async () => ({
    items: [{ ...worker, labels: { pool: 'old' } }]
  }));

  await h.open(cleanupService).onOk();
  assert.deepEqual(
    calls.deleteCacheServiceInstance.mock.calls[0].arguments,
    [1, 10]
  );
  assert.equal(h.onSuccess.mock.callCount(), 1);
  assert.equal(warning.mock.callCount(), 0);
});

test('a missing current target or provider blocks deletion', async (t) => {
  for (const missing of ['target', 'provider']) {
    await t.test(missing, async () => {
      const h = harness();
      if (missing === 'target') {
        calls.queryCacheServiceInstances.mock.mockImplementation(async () => ({
          items: [sibling]
        }));
      } else {
        calls.queryCacheProviders.mock.mockImplementation(async () => ({
          items: []
        }));
      }
      await assert.rejects(h.open().onOk());
      assert.equal(calls.deleteCacheServiceInstance.mock.callCount(), 0);
      assert.equal(h.onSuccess.mock.callCount(), 0);
      assert.equal(warning.mock.callCount(), 1);
      assert.equal(warning.mock.calls[0].arguments[0], unavailable);
    });
  }
});

test('failed preflight requests or missing worker accounting never delete the instance', async (t) => {
  for (const name of [
    'queryCacheServiceDetail',
    'queryCacheServiceInstances',
    'queryCacheProviders',
    'queryWorkersList'
  ] as const) {
    await t.test(name, async () => {
      const h = harness();
      const requestError = new Error('Request failed');
      calls[name].mock.mockImplementation(async () => {
        throw requestError;
      });
      await assert.rejects(h.open().onOk(), (error) => error === requestError);
      assert.equal(calls.deleteCacheServiceInstance.mock.callCount(), 0);
      assert.equal(h.onSuccess.mock.callCount(), 0);
      assert.equal(warning.mock.callCount(), 1);
      assert.equal(warning.mock.calls[0].arguments[0], unavailable);
    });
  }
  await t.test('missing accounting', async () => {
    const h = harness();
    calls.queryWorkersList.mock.mockImplementation(async () => ({
      items: [
        {
          ...worker,
          status: {
            ...worker.status,
            memory: { total: 20 * GiB, used: 19 * GiB }
          }
        }
      ]
    }));
    await assert.rejects(h.open().onOk());
    assert.equal(calls.deleteCacheServiceInstance.mock.callCount(), 0);
    assert.equal(h.onSuccess.mock.callCount(), 0);
    assert.equal(warning.mock.calls[0].arguments[0], unavailable);
  });
});

test('refresh waits for successful DELETE and is skipped if DELETE fails', async () => {
  const h = harness();
  let resolveDelete!: () => void;
  calls.deleteCacheServiceInstance.mock.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        resolveDelete = resolve;
      })
  );
  const confirmation = h.open().onOk();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.onSuccess.mock.callCount(), 0);
  resolveDelete();
  await confirmation;
  assert.equal(h.onSuccess.mock.callCount(), 1);

  calls.deleteCacheServiceInstance.mock.mockImplementation(async () => {
    throw new Error('Delete failed');
  });
  await assert.rejects(h.open().onOk());
  assert.equal(h.onSuccess.mock.callCount(), 1);
  assert.equal(warning.mock.callCount(), 0);
});
