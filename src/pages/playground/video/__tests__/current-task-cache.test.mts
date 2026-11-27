import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

const records = new Map<string, unknown>();
mock.module('@gpustack/core-ui/utils', {
  namedExports: { NS_STORE_NAME: 'test-gpustack' }
});
mock.module('localforage', {
  defaultExport: {
    createInstance: () => ({
      getItem: async (key: string) => records.get(key),
      setItem: async (key: string, value: unknown) => {
        records.set(key, value);
        return value;
      },
      removeItem: async (key: string) => {
        records.delete(key);
      }
    })
  }
});
const { readCurrentVideoTask, writeCurrentVideoTask, clearCurrentVideoTask } =
  await import('../current-task-cache');

test('stores exactly one unchanged ID and full request per user, including binary references', async () => {
  const file = new File(['image'], 'frame.png', { type: 'image/png' });
  const record = {
    video_id: 'engine/native-id',
    params: { prompt: 'A city', media_0: file, seed: 7 }
  };
  await writeCurrentVideoTask('a', record);
  await writeCurrentVideoTask('b', { video_id: 'other', params: {} });
  assert.deepEqual(await readCurrentVideoTask('a'), record);
  assert.equal((await readCurrentVideoTask('a'))?.params.media_0, file);
  await writeCurrentVideoTask('a', {
    video_id: 'replacement',
    params: { seed: 9 }
  });
  assert.equal(records.size, 2);
  assert.equal((await readCurrentVideoTask('a'))?.video_id, 'replacement');
  await clearCurrentVideoTask('a');
  assert.equal(await readCurrentVideoTask('a'), undefined);
  assert.equal((await readCurrentVideoTask('b'))?.video_id, 'other');
});

test('ignores malformed or obsolete local values', async () => {
  for (const value of [
    null,
    1,
    [],
    {},
    { video_id: '' },
    { video_id: 'x', params: [] },
    { video_id: 'x', params: null }
  ]) {
    records.set('v1:bad', value);
    assert.equal(await readCurrentVideoTask('bad'), undefined);
  }
});
