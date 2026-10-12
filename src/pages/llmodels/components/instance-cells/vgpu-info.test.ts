import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  GPUTypeSelector,
  ModelInstanceListItem
} from '../../config/types';
import { formatGPUTypeAllocation, getGPUTypeSelector } from './vgpu-info';

const prefill: GPUTypeSelector = {
  type: 'a10',
  accelerator_sliced_memory_percentage: 40,
  accelerator_sliced_cores_percentage: 30
};
const decode: GPUTypeSelector = {
  type: 'a10',
  accelerator_sliced_memory_percentage: 60,
  accelerator_sliced_cores_percentage: 70
};
const intl = {
  formatMessage: (
    { id }: { id: string },
    values?: Record<string, any>
  ): string =>
    id === 'models.table.vgpu.slice'
      ? `${values?.memory}% VRAM / ${values?.cores}% Compute`
      : 'Full GPU'
};
const instance = (role?: string, selector?: GPUTypeSelector) =>
  ({ role, gpu_type_selector: selector }) as ModelInstanceListItem;
const allocation = (
  record: ModelInstanceListItem,
  modelData?: Parameters<typeof getGPUTypeSelector>[1]
) => formatGPUTypeAllocation(intl, getGPUTypeSelector(record, modelData));

test('PD members on the same GPU show their own role allocation', () => {
  const model = {
    gpu_type_selector: null,
    roles: [
      { name: 'prefill', replicas: 1, gpu_type_selector: prefill },
      { name: 'decode', replicas: 1, gpu_type_selector: decode },
      { name: 'router', replicas: 1 }
    ]
  };

  assert.equal(
    allocation(instance('prefill'), model),
    'a10 (40% VRAM / 30% Compute)'
  );
  assert.equal(
    allocation(instance('decode'), model),
    'a10 (60% VRAM / 70% Compute)'
  );
  assert.equal(allocation(instance('router'), model), '');
});

test('role allocations override the model default', () => {
  assert.equal(
    allocation(instance('decode'), {
      gpu_type_selector: prefill,
      roles: [{ name: 'decode', replicas: 1, gpu_type_selector: decode }]
    }),
    'a10 (60% VRAM / 70% Compute)'
  );
});

test('an instance allocation takes precedence over the role and model', () => {
  const snapshot: GPUTypeSelector = {
    type: 'a10',
    accelerator_partitioned_profile: '1g.6gb'
  };
  assert.equal(
    allocation(instance('decode', snapshot), {
      gpu_type_selector: prefill,
      roles: [{ name: 'decode', replicas: 1, gpu_type_selector: decode }]
    }),
    'a10 (1g.6gb)'
  );
});

test('roles without an override inherit the model allocation', () => {
  for (const selector of [undefined, null]) {
    assert.equal(
      allocation(instance('prefill'), {
        gpu_type_selector: prefill,
        roles: [
          { name: 'prefill', replicas: 1, gpu_type_selector: selector },
          { name: 'decode', replicas: 1, gpu_type_selector: decode }
        ]
      }),
      'a10 (40% VRAM / 30% Compute)'
    );
  }
});

test('mixed deployments keep their model-level allocation', () => {
  assert.equal(
    allocation(instance(), { gpu_type_selector: prefill }),
    'a10 (40% VRAM / 30% Compute)'
  );
  assert.equal(
    allocation(instance(), { gpu_type_selector: { type: 'a10' } }),
    'a10 (Full GPU)'
  );
});

test('missing models and unmatched roles do not borrow another role allocation', () => {
  assert.equal(allocation(instance('prefill')), '');
  assert.equal(
    allocation(instance('prefill'), {
      roles: [{ name: 'decode', replicas: 1, gpu_type_selector: decode }]
    }),
    ''
  );
  assert.equal(
    allocation(instance(), {
      roles: [{ name: 'decode', replicas: 1, gpu_type_selector: decode }]
    }),
    ''
  );
});
