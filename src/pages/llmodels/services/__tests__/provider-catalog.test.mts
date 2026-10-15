import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

mock.module('@gpustack/core-ui', {
  namedExports: { useQueryData: () => ({}) }
});
mock.module(
  new URL('../../constants/backend-parameters/index.ts', import.meta.url).href,
  {
    namedExports: { backendOptionsMap: { vllm: 'vllm' } }
  }
);

const requests: {
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
}[] = [];
mock.module(new URL('../../../kv-cache/apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryCacheServices: async () => ({ items: [] }),
    queryCacheProviders: () =>
      new Promise((resolve, reject) => requests.push({ resolve, reject }))
  }
});

const { loadProviders: loadModelProviders } =
  await import('../use-query-cache-services.ts');
const { loadProviders, invalidateCacheProviders } =
  await import('../../../kv-cache/services/provider-catalog.ts');

test('model forms share the catalog refreshed after a provider source save', async () => {
  invalidateCacheProviders();
  const start = requests.length;
  const initial = loadModelProviders();
  assert.equal(loadProviders(), initial);
  assert.equal(requests.length, start + 1);
  requests[start].resolve({ items: [{ name: 'old' }] });
  assert.deepEqual(await initial, [{ name: 'old' }]);

  invalidateCacheProviders();
  const refreshed = loadProviders();
  assert.equal(loadModelProviders(), refreshed);
  assert.equal(requests.length, start + 2);
  requests[start + 1].resolve({ items: [{ name: 'new' }] });
  await refreshed;
  assert.deepEqual(await loadModelProviders(), [{ name: 'new' }]);
  assert.equal(requests.length, start + 2);
});

test('a failed catalog request can be retried from a model form', async () => {
  invalidateCacheProviders();
  const start = requests.length;
  const failed = loadProviders();
  assert.equal(loadModelProviders(), failed);
  const rejected = assert.rejects(failed, /unavailable/);
  requests[start].reject(new Error('unavailable'));
  await rejected;

  const retried = loadModelProviders();
  assert.equal(loadProviders(), retried);
  requests[start + 1].resolve({ items: [{ name: 'recovered' }] });
  assert.deepEqual(await retried, [{ name: 'recovered' }]);
});
