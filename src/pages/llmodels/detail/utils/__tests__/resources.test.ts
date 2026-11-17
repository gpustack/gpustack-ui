import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  gpuDeviceLabel,
  instanceGPUState,
  sortResourceDevices
} from '../resources';

test('GPU labels omit the default chip and identify a nonzero chip explicitly', () => {
  assert.equal(gpuDeviceLabel({ index: 0, chip_index: 0 }), 'GPU 0');
  assert.equal(gpuDeviceLabel({ index: 2 }), 'GPU 2');
  assert.equal(
    gpuDeviceLabel({ index: 3, chip_index: 1 }, '芯片'),
    'GPU 3 · 芯片 1'
  );
});
test('resource utilization sorting keeps zero and always places missing readings last', () => {
  const devices: any[] = [
    { id: 'missing', current: {} },
    { id: 'busy', current: { gpu_utilization: 80 } },
    { id: 'idle', current: { gpu_utilization: 0 } },
    { id: 'invalid', current: { gpu_utilization: NaN } }
  ];
  assert.deepEqual(
    sortResourceDevices(devices, 'ascend').map((d) => d.id),
    ['idle', 'busy', 'missing', 'invalid']
  );
  assert.deepEqual(
    sortResourceDevices(devices, 'descend').map((d) => d.id),
    ['busy', 'idle', 'missing', 'invalid']
  );
  assert.equal(devices[0].id, 'missing');
});
test('an unallocated Router is distinct from a hidden or not-yet-reported GPU association', () => {
  assert.equal(
    instanceGPUState({ id: 1, gpu_indexes: [] } as any, []),
    'unallocated'
  );
  assert.equal(
    instanceGPUState({ id: 1, gpu_indexes: [0] } as any, []),
    'unavailable'
  );
  assert.equal(instanceGPUState({ id: 1 } as any, []), 'unavailable');
  assert.equal(
    instanceGPUState(
      { id: 1, gpu_indexes: [] } as any,
      [{ model_instance_ids: [1] }] as any
    ),
    'visible'
  );
});

const cpuRouter = {
  id: 61,
  role: 'router',
  gpu_indexes: null,
  computed_resource_claim: { ram: 2147483648, vram: {} },
  distributed_servers: {
    mode: 'delegated',
    download_model_files: true,
    orchestration_mode: 'legacy',
    subordinate_workers: [],
    workloads: []
  }
};

test('a Router with explicit null GPU indexes and an empty VRAM claim ignores distributed control metadata', () => {
  assert.equal(instanceGPUState(cpuRouter as any, []), 'unallocated');
  assert.equal(
    instanceGPUState({ ...cpuRouter, gpu_indexes: [] } as any, []),
    'unallocated'
  );
});

test('real allocations and unknown placement fields never become an unallocated Router', () => {
  const cases = [
    { ...cpuRouter, gpu_indexes: [0] },
    { ...cpuRouter, computed_resource_claim: { vram: { 0: 1024 } } },
    {
      ...cpuRouter,
      gpu_indexes: [],
      computed_resource_claim: { vram: { 0: 1024 } }
    },
    { ...cpuRouter, gpu_indexes: undefined },
    { ...cpuRouter, computed_resource_claim: undefined },
    { ...cpuRouter, computed_resource_claim: { vram: null } },
    { ...cpuRouter, role: 'prefill' },
    {
      ...cpuRouter,
      distributed_servers: {
        ...cpuRouter.distributed_servers,
        subordinate_workers: [{ gpu_indexes: [0] }]
      }
    },
    {
      ...cpuRouter,
      distributed_servers: {
        ...cpuRouter.distributed_servers,
        workloads: [{ dp_rank_placements: [{ gpu_indexes: [0] }] }]
      }
    },
    {
      ...cpuRouter,
      distributed_servers: { ...cpuRouter.distributed_servers, workloads: [{}] }
    },
    { ...cpuRouter, distributed_servers: { mode: 'delegated' } }
  ];
  for (const instance of cases)
    assert.equal(
      instanceGPUState(instance as any, []),
      'unavailable',
      JSON.stringify(instance)
    );
});
