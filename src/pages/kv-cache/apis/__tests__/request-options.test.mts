import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const request = mock.fn(async (_url: string, _options: any) => ({ items: [] }));
mock.module('@umijs/max', { namedExports: { request } });
mock.module('antd', { namedExports: { message: {} } });
mock.module(new URL('../../../../config/settings.ts', import.meta.url).href, {
  namedExports: { GPUSTACK_API_BASE_URL: 'v1' }
});
mock.module(
  new URL('../../../../utils/download-stream.ts', import.meta.url).href,
  {
    namedExports: { downloadFile: () => {} }
  }
);

// Keep the API wrappers real and intercept their external request boundary.
const {
  queryCacheProviders,
  queryCacheServiceDetail,
  queryCacheServiceInstances,
  deleteCacheServiceInstance
} = await import('../index.ts');
const { queryWorkersList } = await import('../../../resources/apis/index.ts');
const cases = [
  {
    name: 'service detail',
    invoke: (options?: any) => queryCacheServiceDetail(7, options),
    url: '/cache-services/7',
    params: undefined
  },
  {
    name: 'instances',
    invoke: (options?: any) => queryCacheServiceInstances(7, options),
    url: '/cache-services/7/instances',
    params: undefined
  },
  {
    name: 'providers',
    invoke: (options?: any) => queryCacheProviders({ page: -1 }, options),
    url: '/cache-providers',
    params: { page: -1 }
  },
  {
    name: 'workers',
    invoke: (options?: any) =>
      queryWorkersList({ cluster_id: 3, page: -1 }, options),
    url: '/workers',
    params: { cluster_id: 3, page: -1 }
  }
];

test('preflight GET wrappers forward local error handling and cancellation options', async (t) => {
  for (const entry of cases) {
    await t.test(entry.name, async () => {
      request.mock.resetCalls();
      const token = { cancel: 'preflight' };
      await entry.invoke({ token, skipErrorHandler: true });
      const [url, options] = request.mock.calls[0].arguments;
      assert.equal(url, entry.url);
      assert.equal(options.method, 'GET');
      assert.deepEqual(options.params, entry.params);
      assert.equal(options.cancelToken, token);
      assert.equal(options.skipErrorHandler, true);
    });
  }
});

test('ordinary GET calls retain global error handling unless explicitly skipped', async (t) => {
  for (const entry of cases) {
    await t.test(entry.name, async () => {
      for (const options of [undefined, { skipErrorHandler: false }]) {
        request.mock.resetCalls();
        await entry.invoke(options);
        assert.equal(
          request.mock.calls[0].arguments[1].skipErrorHandler,
          options?.skipErrorHandler
        );
      }
    });
  }
});

test('DELETE keeps the global error handler enabled', async () => {
  request.mock.resetCalls();
  await deleteCacheServiceInstance(7, 11);
  assert.deepEqual(request.mock.calls[0].arguments, [
    '/cache-services/7/instances/11',
    { method: 'DELETE' }
  ]);
});
