import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ResourceAssociation } from '../../config/types';
import { groupResourceModels, resourceModelRows } from '../model-groups';
const instance = (
  id: number,
  model_id: number,
  model_name: string,
  name = `instance-${id}`
): ResourceAssociation => ({
  id,
  model_id,
  model_name,
  name,
  state: 'running',
  gpu_device_ids: ['gpu-a', 'gpu-b'],
  spans_workers: false
});
test('models group by ID rather than a reusable display name; instances retain all GPUs', () => {
  const groups = groupResourceModels(
    [instance(1, 7, 'same'), instance(2, 7, 'same'), instance(3, 8, 'same')],
    ''
  );
  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.map((g) => g.instances.length),
    [2, 1]
  );
  assert.deepEqual(groups[0].instances[0].gpu_device_ids, ['gpu-a', 'gpu-b']);
});
test('model search keeps its related instances; instance search narrows the same authorized list', () => {
  const data = [
    instance(1, 7, 'Qwen', 'decode-a'),
    instance(2, 7, 'Qwen', 'prefill-b'),
    instance(3, 8, 'DeepSeek', 'other')
  ];
  assert.equal(groupResourceModels(data, 'qWen')[0].instances.length, 2);
  assert.deepEqual(
    groupResourceModels(data, 'decode').flatMap((g) =>
      g.instances.map((i) => i.id)
    ),
    [1]
  );
  assert.deepEqual(groupResourceModels(data, 'missing'), []);
});
test('groups expand by default, collapse by stable model ID and never repeat a model on child rows', () => {
  const groups = groupResourceModels(
    [instance(1, 7, 'Qwen'), instance(2, 7, 'Qwen'), instance(3, 8, 'Other')],
    ''
  );
  assert.equal(
    resourceModelRows(groups, []).filter((r) => r.kind === 'instance').length,
    3
  );
  const rows = resourceModelRows(groups, [7]);
  assert.equal(rows.filter((r) => r.kind === 'model').length, 2);
  assert.deepEqual(
    rows.filter((r) => r.kind === 'instance').map((r) => r.instance.id),
    [3]
  );
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
});
