import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const calls: Array<[string, any]> = [];
const models = new Map<number, any>();
mock.module('@umijs/max', {
  namedExports: {
    request: async (url: string, options: any) => {
      calls.push([url, options]);
      const id = Number(url.split('/').at(-1));
      if (options.method === 'GET') {
        if (!models.has(id)) throw new Error('deployment not found');
        return structuredClone(models.get(id));
      }
      return { id, ...options.data };
    }
  }
});
const { updateModel, updateModelLifecycle } = await import('./index.ts');
const { getStartUpdate, getStopUpdate } =
  await import('../utils/deployment-lifecycle.ts');

test('scheduled and ordinary lifecycle operations reuse the model PUT endpoint', async () => {
  const plan = {
    enabled: true,
    baseline_replicas: 0,
    rules: [{ start_cron: '0 9 * * *', duration_seconds: 3600, replicas: 4 }]
  };
  const scheduled = { name: 'scheduled', replicas: 4, scaling_schedule: plan };
  const stopped = await updateModel({
    id: 7,
    data: { ...scheduled, ...getStopUpdate(scheduled) } as any
  });
  await updateModel({
    id: 7,
    data: { ...stopped, ...getStartUpdate(stopped) } as any
  });
  const manual = { name: 'manual', replicas: 4 };
  await updateModel({
    id: 7,
    data: { ...manual, ...getStopUpdate(manual) } as any
  });
  await updateModel({
    id: 7,
    data: { ...manual, ...getStartUpdate({ ...manual, replicas: 0 }) } as any
  });
  assert.ok(
    calls.every(
      ([url, options]) => url === '/models/7' && options.method === 'PUT'
    )
  );
  assert.deepEqual(calls[0][1].data.scaling_schedule, {
    ...plan,
    paused: true
  });
  assert.deepEqual(calls[1][1].data.scaling_schedule, {
    ...plan,
    paused: false
  });
  assert.equal(calls[2][1].data.replicas, 0);
  assert.equal(calls[3][1].data.replicas, 1);
  assert.equal('paused' in calls[2][1].data, false);
  assert.equal('scaling_schedule' in calls[2][1].data, false);
});

test('batch start filters current deployments and includes selections on other pages', async () => {
  calls.length = 0;
  const plan = {
    enabled: true,
    baseline_replicas: 2,
    rules: [{ start_cron: '0 9 * * *', duration_seconds: 3600, replicas: 4 }]
  };
  models.set(1, { id: 1, name: 'stopped', replicas: 0 });
  models.set(2, { id: 2, name: 'running', replicas: 4 });
  models.set(3, {
    id: 3,
    name: 'paused-on-another-page',
    replicas: 0,
    scaling_schedule: { ...plan, paused: true }
  });
  models.set(4, {
    id: 4,
    name: 'waiting',
    replicas: 0,
    scaling_schedule: plan
  });
  const results = await Promise.all(
    [1, 2, 3, 4].map((id) => updateModelLifecycle(id, 'start'))
  );
  assert.deepEqual(
    calls.filter(([, options]) => options.method === 'GET').map(([url]) => url),
    ['/models/1', '/models/2', '/models/3', '/models/4']
  );
  const writes = calls.filter(([, options]) => options.method === 'PUT');
  assert.deepEqual(
    writes.map(([url]) => url),
    ['/models/1', '/models/3']
  );
  assert.equal(writes[0][1].data.replicas, 1);
  assert.deepEqual(writes[1][1].data.scaling_schedule, {
    ...plan,
    paused: false
  });
  assert.equal(results[1], null);
  assert.equal(results[3], null);
});

test('batch stop uses the latest disabled plan and updated configuration', async () => {
  calls.length = 0;
  const disabled = {
    enabled: false,
    baseline_replicas: 2,
    rules: [{ start_cron: '0 9 * * *', duration_seconds: 3600, replicas: 4 }]
  };
  models.set(5, {
    id: 5,
    name: 'changed-since-selection',
    replicas: 3,
    scaling_schedule: disabled,
    description: 'latest edit'
  });
  models.set(6, { id: 6, name: 'already-stopped', replicas: 0 });
  const activePlan = { ...disabled, enabled: true };
  models.set(7, {
    id: 7,
    name: 'waiting-on-another-page',
    replicas: 0,
    scaling_schedule: activePlan
  });
  models.set(8, {
    id: 8,
    name: 'already-paused',
    replicas: 0,
    scaling_schedule: { ...activePlan, paused: true }
  });
  await Promise.all([5, 6, 7, 8].map((id) => updateModelLifecycle(id, 'stop')));
  const writes = calls.filter(([, options]) => options.method === 'PUT');
  assert.equal(writes.length, 2);
  assert.equal(writes[0][0], '/models/5');
  assert.equal(writes[0][1].data.replicas, 0);
  assert.deepEqual(writes[0][1].data.scaling_schedule, disabled);
  assert.equal(writes[0][1].data.description, 'latest edit');
  assert.equal(writes[1][0], '/models/7');
  assert.equal(writes[1][1].data.replicas, 0);
  assert.deepEqual(writes[1][1].data.scaling_schedule, {
    ...activePlan,
    paused: true
  });
});

test('failed reads do not fall back to a stale deployment or block other selections', async () => {
  calls.length = 0;
  models.set(5, { id: 5, name: 'running', replicas: 3 });
  const results = await Promise.allSettled(
    [99, 5].map((id) => updateModelLifecycle(id, 'stop'))
  );
  assert.equal(results[0].status, 'rejected');
  assert.equal(results[1].status, 'fulfilled');
  assert.deepEqual(
    calls.filter(([, options]) => options.method === 'PUT').map(([url]) => url),
    ['/models/5']
  );
});
