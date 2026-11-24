import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateGPUIds, generateGPUSelector } from './index';

// The backend normalizes a count-only selector (`gpus_per_replica` without
// explicit ids) to `{ gpu_ids: null, gpus_per_replica: N }`. Lodash's `_.get`
// default only replaces `undefined`, so that `null` reached `.length` and the
// PD edit form crashed with "Cannot read properties of null (reading 'length')".
const countOnly = { gpu_selector: { gpu_ids: null, gpus_per_replica: 8 } };

test('opening a count-only selector for edit does not crash', () => {
  assert.deepEqual(generateGPUSelector(countOnly, []), { gpu_selector: null });
});

test('saving a count-only selector keeps its GPU count', () => {
  assert.deepEqual(generateGPUIds(countOnly as any), {
    gpu_selector: { gpu_ids: null, gpus_per_replica: 8 },
    gpu_type_selector: null
  });
});

test('a selector with neither ids nor a count is still cleared', () => {
  for (const gpu_selector of [
    null,
    { gpu_ids: null, gpus_per_replica: null },
    { gpu_ids: [], gpus_per_replica: null }
  ]) {
    assert.deepEqual(generateGPUIds({ gpu_selector } as any), {
      gpu_selector: null,
      gpu_type_selector: null
    });
  }
});
