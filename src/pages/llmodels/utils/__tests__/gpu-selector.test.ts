import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateGPUIds, generateGPUSelector } from '../index';

// The backend normalizes a count-only selector (`gpus_per_replica` without
// explicit ids) to `{ gpu_ids: null, gpus_per_replica: N }`. Lodash's `_.get`
// default only replaces `undefined`, so that `null` reached `.length` and the
// PD edit form crashed with "Cannot read properties of null (reading 'length')".
const countOnly = { gpu_selector: { gpu_ids: null, gpus_per_replica: 8 } };

// The model-level edit drawer writes this result straight into the form, so a
// `null` here would wipe the count and the next save would drop it.
test('opening a count-only selector for edit keeps its GPU count', () => {
  assert.deepEqual(generateGPUSelector(countOnly, []), {
    gpu_selector: { gpu_ids: [], gpus_per_replica: 8 }
  });
});

test('a count-only selector opened for edit saves back unchanged', () => {
  const opened = generateGPUSelector(countOnly, []);
  assert.deepEqual(
    generateGPUIds(opened as any).gpu_selector,
    countOnly.gpu_selector
  );
});

test('opening a selector with neither ids nor a count leaves it empty', () => {
  for (const gpu_selector of [
    null,
    { gpu_ids: null, gpus_per_replica: null }
  ]) {
    assert.deepEqual(generateGPUSelector({ gpu_selector }, []), {
      gpu_selector: null
    });
  }
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
