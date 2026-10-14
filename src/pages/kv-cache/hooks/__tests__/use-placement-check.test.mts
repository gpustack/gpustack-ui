import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import type { CacheProviderItem } from '../../config/types';
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
    labels,
    status: {
      memory: { total: totalGib * GiB, used: usedGib * GiB },
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

const evaluate = (inputs: Partial<PlacementInputs> = {}) =>
  evaluatePlacement(
    {
      provider,
      providerVersion: '2.0.0',
      workers: [occupied],
      workerId: occupied.id,
      ...inputs
    },
    intl
  );

test('a version edit does not count the service RAM twice, while creation still checks free RAM', () => {
  for (const currentProvider of [provider, perNodeProvider]) {
    assert.deepEqual(
      evaluate({ provider: currentProvider, checkFreeMemory: false }),
      hidden,
      currentProvider.topology
    );
    for (const checkFreeMemory of [undefined, true]) {
      assert.deepEqual(
        evaluate({ provider: currentProvider, checkFreeMemory }),
        warning('kvCache.form.ramSize.exceedsFree', {
          worker: occupied.name,
          free: 5
        }),
        `${currentProvider.topology}, checkFreeMemory=${checkFreeMemory}`
      );
    }
  }
});

test('total RAM remains a limit when editing, including the existing equality boundary', () => {
  for (const ramSize of [20, 21]) {
    for (const checkFreeMemory of [false, true]) {
      assert.deepEqual(
        evaluate({
          fieldValues: { ram_size: ramSize },
          checkFreeMemory
        }),
        warning('kvCache.form.ramSize.exceedsTotal', {
          worker: occupied.name,
          total: 20
        }),
        `ram_size=${ramSize}, checkFreeMemory=${checkFreeMemory}`
      );
    }
  }
});

test('editing checks the newly selected worker or per-node selector against total RAM', () => {
  const small = worker(2, 10, 0, { pool: 'small' });
  const full = worker(3, 40, 40, { pool: 'full' });
  const cases: {
    name: string;
    inputs: Partial<PlacementInputs>;
    expected: ResourceCheckStatus;
  }[] = [
    {
      name: 'a new worker can fit the service despite no currently free RAM',
      inputs: { workerId: full.id },
      expected: hidden
    },
    {
      name: 'a new worker total cannot fit the service',
      inputs: { workerId: small.id },
      expected: warning('kvCache.form.ramSize.exceedsTotal', {
        worker: small.name,
        total: 10
      })
    },
    {
      name: 'a new per-node selector restricts the capacity check to its targets',
      inputs: {
        provider: perNodeProvider,
        workerSelector: { pool: 'full' }
      },
      expected: hidden
    },
    {
      name: 'every per-node target must have enough total RAM',
      inputs: { provider: perNodeProvider },
      expected: warning('kvCache.form.ramSize.exceedsTotal', {
        worker: small.name,
        total: 10
      })
    },
    {
      name: 'a selector without a matching worker still warns',
      inputs: {
        provider: perNodeProvider,
        workerSelector: { pool: 'missing' }
      },
      expected: warning('kvCache.check.noWorkers')
    }
  ];
  for (const { name, inputs, expected } of cases) {
    assert.deepEqual(
      evaluate({
        workers: [occupied, small, full],
        checkFreeMemory: false,
        ...inputs
      }),
      expected,
      name
    );
  }
});

test('skipping free RAM for edits preserves version compatibility checks on the target workers', () => {
  const cuda = worker(2, 20, 15, { pool: 'cuda' }, 'cuda');
  const rocm = worker(3, 20, 15, { pool: 'rocm' }, 'rocm');
  for (const currentProvider of [provider, perNodeProvider]) {
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
          provider: currentProvider,
          providerVersion: 'gpu-only',
          workers: [occupied, cuda, rocm],
          workerId: target.id,
          workerSelector: target.labels,
          checkFreeMemory: false
        }),
        expected,
        `${currentProvider.topology}, ${target.name}`
      );
    }
  }
});

test('replica pools check total RAM on edit and keep free RAM checks on creation', () => {
  const anotherOccupied = worker(2, 20, 15);
  const inputs = {
    provider: poolProvider,
    workers: [occupied, anotherOccupied]
  };
  assert.deepEqual(evaluate({ ...inputs, checkFreeMemory: false }), hidden);
  assert.deepEqual(
    evaluate(inputs),
    warning('kvCache.check.store.exceedsFree', {
      count: 0,
      replicas: 2,
      size: 15
    })
  );

  const small = worker(3, 10, 0);
  assert.deepEqual(
    evaluate({
      ...inputs,
      workers: [occupied, small],
      checkFreeMemory: false
    }),
    warning('kvCache.check.store.exceedsTotal', {
      count: 1,
      replicas: 2,
      size: 15
    })
  );
});

test('pool replica and selector edits still require enough matching workers', () => {
  const workers = [
    occupied,
    worker(2, 20, 0, { pool: 'existing' }),
    worker(3, 40, 0, { pool: 'other' })
  ];
  for (const checkFreeMemory of [false, true]) {
    assert.deepEqual(
      evaluate({
        provider: poolProvider,
        workers,
        workerSelector: { pool: 'existing' },
        fieldValues: { replicas: 3 },
        checkFreeMemory
      }),
      warning('kvCache.check.store.insufficientWorkers', {
        count: 2,
        replicas: 3
      })
    );
  }
});

test('pool edits leave unknown total RAM undecided without changing creation checks', () => {
  const unreported = {
    ...worker(2, 20, 15, { pool: 'existing' }),
    status: { gpu_devices: [] }
  } as PlacementInputs['workers'][number];
  const inputs = {
    provider: poolProvider,
    workers: [occupied, unreported]
  };

  assert.deepEqual(evaluate({ ...inputs, checkFreeMemory: false }), hidden);
  assert.deepEqual(
    evaluate(inputs),
    warning('kvCache.check.store.exceedsFree', {
      count: 0,
      replicas: 2,
      size: 15
    })
  );

  // Unknown RAM on a worker outside the selector must not hide a known
  // capacity shortage among the actual targets.
  assert.deepEqual(
    evaluate({
      provider: poolProvider,
      workers: [
        occupied,
        worker(3, 10, 0, { pool: 'existing' }),
        { ...unreported, labels: { pool: 'other' } }
      ],
      workerSelector: { pool: 'existing' },
      checkFreeMemory: false
    }),
    warning('kvCache.check.store.exceedsTotal', {
      count: 1,
      replicas: 2,
      size: 15
    })
  );
});
