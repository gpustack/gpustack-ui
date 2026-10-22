import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import type {
  CacheProviderItem,
  CacheServiceInstanceItem
} from '../../config/types';
import type {
  PlacementInputs,
  ResourceCheckStatus
} from '../use-placement-check';

// Keep placement, provider-profile resolution, and worker helpers real.
// Only framework hooks and the config module's presentation imports are stubbed.
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({}) }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (callback: unknown) => callback }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    IconFont: () => null,
    GrafanaIcon: () => null,
    icons: {}
  }
});

const { evaluatePlacement } = await import('../use-placement-check');

const formatMessage = (
  { id }: { id: string },
  values?: Record<string, unknown>
) => JSON.stringify({ id, values });
const intl = { formatMessage } as unknown as Parameters<
  typeof evaluatePlacement
>[1];
const hidden: ResourceCheckStatus = { show: false, message: '' };
const warning = (
  id: string,
  values?: Record<string, unknown>
): ResourceCheckStatus => ({
  show: true,
  type: 'warning',
  message: formatMessage({ id }, values)
});

const GiB = 1024 ** 3;
const worker = (
  id: number,
  totalGib: number,
  usedGib: number,
  labels: Record<string, string> = {},
  accelerator?: string
) =>
  ({
    id,
    name: `worker-${id}`,
    state: 'ready',
    labels,
    status: {
      memory: {
        total: totalGib * GiB,
        used: usedGib * GiB,
        allocated: usedGib * GiB
      },
      gpu_devices: accelerator ? [{ type: accelerator }] : []
    }
  }) as PlacementInputs['workers'][number];

const occupied = worker(1, 20, 15, { pool: 'existing' });
const provider: CacheProviderItem = {
  name: 'test-cache',
  display_name: 'Test Cache',
  source: 'built_in',
  topology: 'replicas',
  versions: {
    '1.0.0': { image: 'test:1' },
    '2.0.0': { image: 'test:2' },
    'gpu-only': {
      image: '',
      runtime_images: { cuda: { '12.8': 'test:cuda' } }
    }
  },
  fields: [
    { name: 'ram_size', default: 15 },
    { name: 'replicas', default: 2 }
  ],
  resource_profile: { ram_gib: '{{ram_size}}' },
  inference_backend_integrations: []
};
const perNodeProvider: CacheProviderItem = {
  ...provider,
  topology: 'per_node'
};
const poolProvider: CacheProviderItem = {
  ...provider,
  components: {
    stores: {
      topology: 'replicas',
      replicas_by: 'replicas',
      resource_profile: { ram_gib: '{{ram_size}}' }
    }
  }
};

const instance = (
  id: number,
  workerId: number,
  ramGib: number,
  component?: string
): CacheServiceInstanceItem =>
  ({
    id,
    name: `instance-${id}`,
    cache_service_id: 1,
    worker_id: workerId,
    cluster_id: 1,
    component,
    state: 'running',
    computed_resource_claim: { ram: ramGib * GiB }
  }) as CacheServiceInstanceItem;
const old = instance(1, occupied.id, 15);
const evaluate = (inputs: Partial<PlacementInputs> = {}) =>
  evaluatePlacement(
    {
      provider,
      providerVersion: '2.0.0',
      workers: [occupied],
      workerId: occupied.id,
      mode: 'recreate',
      replacingInstances: [old],
      ...inputs
    },
    intl
  );
const insufficient = (workerId: number, required: number, available: number) =>
  warning('kvCache.check.recreate.insufficientRam', {
    worker: `worker-${workerId}`,
    required,
    available
  });
const unavailable = warning('kvCache.check.recreate.unavailable');

test('a version replacement reclaims the existing 15 GiB instead of checking 5 GiB free', () => {
  for (const currentProvider of [provider, perNodeProvider]) {
    assert.deepEqual(evaluate({ provider: currentProvider }), hidden);
    for (const mode of [undefined, 'create'] as const) {
      assert.deepEqual(
        evaluate({ provider: currentProvider, mode }),
        warning('kvCache.form.ramSize.exceedsFree', {
          worker: occupied.name,
          free: 5
        })
      );
    }
  }
});

test('creation keeps its total-memory boundary and free-memory success behavior', () => {
  assert.deepEqual(
    evaluate({ mode: 'create', fieldValues: { ram_size: 20 } }),
    warning('kvCache.form.ramSize.exceedsTotal', {
      worker: occupied.name,
      total: 20
    })
  );
  assert.deepEqual(evaluate({ mode: 'create', fieldValues: { ram_size: 4 } }), {
    show: true,
    type: 'success',
    message: formatMessage(
      { id: 'kvCache.check.ok.singleton' },
      { worker: occupied.name }
    )
  });
});

test('creation rejects empty clusters and non-Ready snapshots before checking RAM', () => {
  const states = [
    'not_ready',
    'unreachable',
    'provisioning',
    'deleting',
    'error',
    'pending',
    'initializing',
    'maintenance',
    undefined
  ];
  for (const currentProvider of [
    provider,
    perNodeProvider,
    poolProvider,
    { ...provider, resource_profile: undefined }
  ]) {
    for (const workers of [
      [],
      ...states.map((state) => [{ ...worker(1, 64, 0), state }])
    ]) {
      assert.deepEqual(
        evaluate({
          provider: currentProvider,
          mode: 'create',
          workers: workers as PlacementInputs['workers']
        }),
        {
          show: true,
          type: 'danger',
          message: formatMessage({ id: 'kvCache.check.noReadyWorkers' })
        }
      );
    }
  }
});

test('per-node capacity and compatibility checks count only Ready workers', () => {
  assert.deepEqual(
    evaluate({
      provider: perNodeProvider,
      providerVersion: 'gpu-only',
      mode: 'create',
      workers: [
        worker(1, 64, 0, {}, 'cuda'),
        { ...worker(2, 1, 1), state: 'unreachable' }
      ]
    }),
    {
      show: true,
      type: 'success',
      message: formatMessage({ id: 'kvCache.check.ok.perNode' }, { count: 1 })
    }
  );
});

test('creation rejects a pinned or label-selected target that is not Ready', () => {
  const workers = [
    worker(1, 64, 0, { pool: 'ready' }),
    { ...worker(2, 64, 0, { pool: 'offline' }), state: 'not_ready' }
  ];
  for (const selection of [
    { workerId: 2 },
    { workerId: undefined, workerSelector: { pool: 'offline' } },
    { workerId: undefined, workerSelector: { pool: 'missing' } }
  ]) {
    assert.deepEqual(evaluate({ mode: 'create', workers, ...selection }), {
      show: true,
      type: 'danger',
      message: formatMessage({ id: 'kvCache.check.noReadyTargets' })
    });
  }
});

test('replica capacity excludes non-Ready workers even when their snapshots have free RAM', () => {
  assert.deepEqual(
    evaluate({
      mode: 'create',
      provider: poolProvider,
      workerId: undefined,
      workers: [worker(1, 64, 0), { ...worker(2, 64, 0), state: 'not_ready' }]
    }),
    warning('kvCache.check.store.insufficientWorkers', {
      count: 1,
      replicas: 2
    })
  );
});

test('other allocations and system reservation can prevent a replacement', () => {
  const busy = {
    ...worker(1, 20, 19),
    system_reserved: { ram: GiB }
  };
  assert.deepEqual(
    evaluate({ workers: [busy], fieldValues: { ram_size: 16 } }),
    insufficient(1, 16, 15)
  );
});

test('reclaim comes from the frozen old claim, not the new 18 GiB form value', () => {
  assert.deepEqual(
    evaluate({
      workers: [worker(1, 20, 18)],
      fieldValues: { ram_size: 18 }
    }),
    insufficient(1, 18, 17)
  );
});

test('physical used RAM is never combined with a declared claim', () => {
  const memory = occupied.status.memory;
  assert.deepEqual(
    evaluate({
      workers: [
        {
          ...occupied,
          status: {
            ...occupied.status,
            memory: { ...memory, used: 19 * GiB, allocated: 15 * GiB }
          }
        }
      ],
      fieldValues: { ram_size: 18 }
    }),
    hidden
  );
});

test('moving workers does not transfer the old worker claim to the new worker', () => {
  assert.deepEqual(
    evaluate({ workers: [occupied, worker(2, 20, 10)], workerId: 2 }),
    insufficient(2, 15, 10)
  );
});

test('a pinned single-component service cannot fall back outside its worker selection', () => {
  assert.deepEqual(
    evaluate({
      workers: [occupied, worker(2, 20, 0, { pool: 'other' })],
      workerId: 1,
      workerSelector: { pool: 'other' }
    }),
    warning('kvCache.check.noWorkers')
  );
  assert.deepEqual(
    evaluate({ workers: [worker(2, 20, 0)], workerId: 1 }),
    warning('kvCache.check.noWorkers')
  );
  assert.deepEqual(
    evaluate({
      workers: [occupied, worker(2, 20, 0, { pool: 'other' })],
      workerId: 1,
      workerSelector: { pool: 'other' },
      recreateInstance: old,
      existingInstances: [old]
    }),
    warning('kvCache.check.noWorkers')
  );
});

test('Error instances retain reservation credit until deleted', () => {
  assert.deepEqual(
    evaluate({ replacingInstances: [{ ...old, state: 'error' }] }),
    hidden
  );
  assert.deepEqual(
    evaluate({
      replacingInstances: [{ ...old, deleted_at: '2026-10-14T00:00:00Z' }]
    }),
    insufficient(1, 15, 5)
  );
});

test('clamping only after removing the old claim avoids manufacturing capacity', () => {
  assert.deepEqual(
    evaluate({
      workers: [{ ...worker(1, 20, 25), system_reserved: { ram: 10 * GiB } }]
    }),
    insufficient(1, 15, 0)
  );
});

test('missing snapshots, claims and allocation metrics leave recreation unavailable', () => {
  const cases: Partial<PlacementInputs>[] = [
    { replacingInstances: undefined },
    { replacingInstances: [{ ...old, computed_resource_claim: undefined }] },
    { replacingInstances: [{ ...old, computed_resource_claim: null }] },
    {
      replacingInstances: [{ ...old, computed_resource_claim: { ram: null } }]
    },
    { replacingInstances: [{ ...old, computed_resource_claim: {} }] },
    { workers: [] },
    { provider: undefined },
    {
      workers: [
        {
          ...occupied,
          status: { ...occupied.status, memory: undefined }
        } as unknown as PlacementInputs['workers'][number]
      ]
    },
    {
      workers: [
        {
          ...occupied,
          status: {
            ...occupied.status,
            memory: { total: 20 * GiB, used: 15 * GiB }
          }
        } as unknown as PlacementInputs['workers'][number]
      ]
    },
    { workers: [worker(1, 20, 14)] }
  ];
  for (const inputs of cases) {
    assert.deepEqual(evaluate(inputs), unavailable);
  }
});

test('an explicit zero claim is known, while duplicated claims cannot add credit twice', () => {
  assert.deepEqual(
    evaluate({
      workers: [worker(1, 20, 0)],
      replacingInstances: [instance(1, 1, 0)]
    }),
    hidden
  );
  const smaller = instance(1, 1, 10);
  assert.deepEqual(
    evaluate({
      workers: [worker(1, 20, 20)],
      replacingInstances: [smaller, smaller]
    }),
    insufficient(1, 15, 10)
  );
});

test('unified RAM deducts reserved VRAM and every allocated GPU from the same budget', () => {
  const unified = {
    ...worker(1, 32, 15),
    system_reserved: { ram: 2 * GiB, vram: 3 * GiB },
    status: {
      ...occupied.status,
      memory: {
        total: 32 * GiB,
        allocated: 15 * GiB,
        used: 15 * GiB,
        is_unified_memory: true
      },
      gpu_devices: [
        { memory: { allocated: 6 * GiB, is_unified_memory: false } },
        { memory: { allocated: 4 * GiB } }
      ]
    }
  } as PlacementInputs['workers'][number];
  assert.deepEqual(
    evaluate({ workers: [unified], fieldValues: { ram_size: 18 } }),
    insufficient(1, 18, 17)
  );
  assert.deepEqual(
    evaluate({
      workers: [
        {
          ...unified,
          status: { ...unified.status, gpu_devices: [{ memory: {} }] }
        } as PlacementInputs['workers'][number]
      ]
    }),
    unavailable
  );
});

test('replica replacement follows pin then worker ID rather than searching for a worker that fits', () => {
  const inputs = {
    provider: poolProvider,
    workers: [worker(3, 40, 0), worker(2, 20, 0), worker(1, 20, 20)],
    replacingInstances: [],
    fieldValues: { ram_size: 15, replicas: 2 }
  };
  assert.deepEqual(evaluate(inputs), insufficient(1, 15, 0));
  assert.deepEqual(
    evaluate({
      ...inputs,
      workerId: 3,
      fieldValues: { ram_size: 15, replicas: 1 }
    }),
    hidden
  );
});

test('replica pools reclaim each target locally and creation retains free-memory checks', () => {
  const inputs = {
    provider: poolProvider,
    workers: [occupied, worker(2, 20, 15)],
    replacingInstances: [
      instance(1, 1, 15, 'stores'),
      instance(2, 2, 15, 'stores')
    ]
  };
  assert.deepEqual(evaluate(inputs), hidden);
  assert.deepEqual(
    evaluate({ ...inputs, mode: 'create' }),
    warning('kvCache.check.store.exceedsFree', {
      count: 0,
      replicas: 2,
      size: 15
    })
  );
  assert.deepEqual(
    evaluate({ ...inputs, fieldValues: { replicas: 3 } }),
    warning('kvCache.check.store.insufficientWorkers', {
      count: 2,
      replicas: 3
    })
  );
});

const multiComponentProvider: CacheProviderItem = {
  ...provider,
  fields: [...provider.fields!, { name: 'extra_enabled', default: true }],
  components: {
    main: {
      topology: 'per_node',
      resource_profile: { ram_gib: '{{ram_size}}' }
    },
    extra: {
      topology: 'per_node',
      enabled_by: 'extra_enabled',
      resource_profile: { ram_gib: '4' }
    }
  }
};

test('enabled component demands are summed on each worker', () => {
  const inputs = {
    provider: multiComponentProvider,
    workers: [worker(1, 20, 18)],
    replacingInstances: [instance(1, 1, 12, 'main'), instance(2, 1, 4, 'extra')]
  };
  assert.deepEqual(evaluate(inputs), insufficient(1, 19, 18));
  assert.deepEqual(
    evaluate({ ...inputs, fieldValues: { extra_enabled: false } }),
    hidden
  );
});

test('single-instance recreation leaves sibling claims allocated and checks only its component', () => {
  const main = instance(1, 1, 12, 'main');
  const extra = instance(2, 1, 4, 'extra');
  assert.deepEqual(
    evaluate({
      provider: multiComponentProvider,
      workers: [worker(1, 20, 18)],
      replacingInstances: [main, extra],
      recreateInstance: main
    }),
    insufficient(1, 15, 14)
  );
  assert.deepEqual(
    evaluate({
      provider: multiComponentProvider,
      workers: [worker(1, 20, 18)],
      replacingInstances: undefined,
      recreateInstance: extra
    }),
    hidden
  );
});

test('single-instance replacement leaves surviving per-node siblings untouched', () => {
  assert.deepEqual(
    evaluate({
      provider: perNodeProvider,
      workers: [occupied, worker(2, 5, 5)],
      recreateInstance: old,
      existingInstances: [old, instance(2, 2, 5)],
      workerId: 2
    }),
    hidden
  );
});

test('an auto-placed single replica can move to the lowest worker after deletion', () => {
  const target = instance(2, 2, 15);
  assert.deepEqual(
    evaluate({
      workerId: undefined,
      workers: [
        { ...worker(1, 20, 19), system_reserved: { ram: GiB } },
        worker(2, 20, 15)
      ],
      recreateInstance: target,
      existingInstances: [target]
    }),
    insufficient(1, 15, 0)
  );
});

test('a surviving sticky replica satisfies the desired slot without recreating a surplus row', () => {
  const target = instance(2, 2, 15);
  const sibling = instance(3, 3, 15);
  assert.deepEqual(
    evaluate({
      workerId: undefined,
      workers: [worker(1, 1, 1), worker(2, 20, 15), worker(3, 20, 15)],
      recreateInstance: target,
      existingInstances: [target, sibling]
    }),
    hidden
  );
});

test('replicas stay on surviving sticky workers before placing a missing replica by ID', () => {
  const target = instance(3, 3, 15, 'stores');
  const sibling = instance(2, 2, 15, 'stores');
  assert.deepEqual(
    evaluate({
      provider: poolProvider,
      workerId: undefined,
      workers: [worker(3, 20, 15), worker(2, 20, 15), worker(1, 10, 0)],
      recreateInstance: target,
      existingInstances: [target, sibling]
    }),
    insufficient(1, 15, 10)
  );
});

test('a per-node instance outside the latest selector can be deleted as cleanup', () => {
  const target = { ...old, computed_resource_claim: undefined };
  assert.deepEqual(
    evaluate({
      provider: perNodeProvider,
      workers: [occupied, worker(2, 20, 20, { pool: 'new' })],
      workerSelector: { pool: 'new' },
      recreateInstance: target,
      existingInstances: [target, instance(2, 2, 15)]
    }),
    hidden
  );
  assert.deepEqual(
    evaluate({
      provider: perNodeProvider,
      workerSelector: { pool: 'missing' },
      recreateInstance: target,
      existingInstances: [target]
    }),
    hidden
  );
});

test('a removed component can be deleted and missing replica context stays unavailable', () => {
  assert.deepEqual(
    evaluate({
      provider: multiComponentProvider,
      recreateInstance: instance(3, 1, 15, 'removed')
    }),
    hidden
  );
  assert.deepEqual(evaluate({ recreateInstance: old }), unavailable);
});

test('selectors restrict per-node targets and unmatched selectors still warn', () => {
  assert.deepEqual(
    evaluate({
      provider: perNodeProvider,
      workers: [occupied, worker(2, 10, 0, { pool: 'other' })],
      workerSelector: { pool: 'existing' }
    }),
    hidden
  );
  assert.deepEqual(
    evaluate({
      provider: perNodeProvider,
      workerSelector: { pool: 'missing' }
    }),
    warning('kvCache.check.noWorkers')
  );
});

test('recreation preserves version compatibility checks on the actual target', () => {
  const cuda = worker(2, 20, 15, { pool: 'cuda' }, 'cuda');
  const rocm = worker(3, 20, 15, { pool: 'rocm' }, 'rocm');
  for (const target of [occupied, cuda, rocm]) {
    const expected =
      target === occupied
        ? warning('kvCache.check.noCpuImage', { count: 1, total: 1 })
        : target === rocm
          ? warning('kvCache.check.unsupportedAccel', {
              count: 1,
              total: 1,
              backends: 'rocm'
            })
          : hidden;
    assert.deepEqual(
      evaluate({
        providerVersion: 'gpu-only',
        workers: [occupied, cuda, rocm],
        workerId: target.id,
        replacingInstances: [instance(target.id, target.id, 15)]
      }),
      expected
    );
  }
});

test('all disabled components need no placement or allocation snapshot', () => {
  const disabledProvider: CacheProviderItem = {
    ...provider,
    fields: [{ name: 'enabled', default: false }],
    components: {
      first: {
        topology: 'per_node',
        enabled_by: 'enabled',
        resource_profile: { ram_gib: '15' }
      },
      second: {
        topology: 'replicas',
        enabled_by: 'enabled',
        replicas: 3,
        resource_profile: { ram_gib: '4' }
      }
    }
  };
  assert.deepEqual(
    evaluate({
      provider: disabledProvider,
      workers: [],
      replacingInstances: undefined
    }),
    hidden
  );
  assert.deepEqual(
    evaluate({
      provider: disabledProvider,
      fieldValues: { enabled: true },
      workerSelector: { pool: 'missing' }
    }),
    warning('kvCache.check.store.insufficientWorkers', {
      count: 0,
      replicas: 3
    })
  );
});

test('deleting a disabled component is cleanup and does not require its old worker or claim', () => {
  assert.deepEqual(
    evaluate({
      provider: multiComponentProvider,
      fieldValues: { extra_enabled: false },
      workers: [],
      replacingInstances: undefined,
      recreateInstance: {
        ...instance(2, 1, 4, 'extra'),
        computed_resource_claim: undefined
      }
    }),
    hidden
  );
});

test('known zero RAM demand needs no reservation metrics, unlike an unresolved profile', () => {
  const unreported = {
    ...occupied,
    status: { gpu_devices: [] }
  } as unknown as PlacementInputs['workers'][number];
  for (const profile of [
    undefined,
    { ram_gib: '0' },
    { ram_gib: '{{ram_size}}' }
  ]) {
    assert.deepEqual(
      evaluate({
        provider: { ...provider, resource_profile: profile },
        fieldValues: { ram_size: 0 },
        workers: [unreported],
        replacingInstances: undefined
      }),
      hidden
    );
  }
  assert.deepEqual(
    evaluate({
      provider: { ...provider, resource_profile: { ram_gib: '{{missing}}' } }
    }),
    unavailable
  );
});

test('hidden replica fields use their gated default instead of a stale user value', () => {
  const gatedPool: CacheProviderItem = {
    ...poolProvider,
    fields: [
      ...provider.fields!.filter((field) => field.name !== 'replicas'),
      { name: 'distributed', default: false },
      {
        name: 'replicas',
        default: 2,
        visible_by: 'distributed',
        visible_when: true,
        gated_default: 1
      }
    ]
  };
  assert.deepEqual(
    evaluate({ provider: gatedPool, fieldValues: { replicas: 2 } }),
    hidden
  );
  assert.deepEqual(
    evaluate({
      provider: gatedPool,
      fieldValues: { distributed: true, replicas: 2 }
    }),
    warning('kvCache.check.store.insufficientWorkers', {
      count: 1,
      replicas: 2
    })
  );
});

test('chained gates resolve RAM demand before the replacement budget is checked', () => {
  const gatedProvider: CacheProviderItem = {
    ...provider,
    fields: [
      { name: 'advanced', default: false },
      {
        name: 'large',
        default: true,
        visible_by: 'advanced',
        visible_when: true,
        gated_default: false
      },
      {
        name: 'ram_size',
        default: 15,
        visible_by: 'large',
        visible_when: true,
        gated_default: 1
      }
    ]
  };
  const inputs = {
    provider: gatedProvider,
    workers: [worker(1, 3, 0)],
    replacingInstances: []
  };
  assert.deepEqual(
    evaluate({ ...inputs, fieldValues: { large: true, ram_size: 15 } }),
    hidden
  );
  assert.deepEqual(
    evaluate({
      ...inputs,
      fieldValues: { advanced: true, large: true, ram_size: 15 }
    }),
    insufficient(1, 15, 3)
  );
});
