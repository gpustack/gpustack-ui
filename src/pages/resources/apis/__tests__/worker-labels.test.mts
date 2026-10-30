import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const request = mock.fn(async (_url: string, _options: any) => undefined);
mock.module('@umijs/max', { namedExports: { request } });
mock.module('antd', { namedExports: { message: {} } });
mock.module(new URL('../../../../config/settings.ts', import.meta.url).href, {
  namedExports: { GPUSTACK_API_BASE_URL: 'v1' }
});
mock.module(
  new URL('../../../../utils/download-stream.ts', import.meta.url).href,
  { namedExports: { downloadFile: () => {} } }
);
const api = await import('../index.ts');

test('batch labels POST sends only ids and label patch and accepts a 204 response', async () => {
  assert.equal(typeof api.updateWorkerLabels, 'function');
  const data = { worker_ids: [1, 99], labels: { pool: 'new' } };
  assert.equal(await api.updateWorkerLabels(data), undefined);
  assert.deepEqual(request.mock.calls[0].arguments, [
    '/workers/labels',
    { method: 'POST', data }
  ]);
});

for (const labels of [
  ['arch=amd64', 'city=New York, US', 'url=http://host?a=b'],
  []
]) {
  test(`worker list serializes ${labels.length} labels as repeated parameters`, async () => {
    await api.queryWorkersList({ label: labels, cluster_id: 7, page: 1 });
    const [url, options] = request.mock.calls.at(-1)!.arguments;
    assert.equal(url, '/workers');
    const query = new URLSearchParams(options.paramsSerializer(options.params));
    assert.deepEqual(query.getAll('label'), labels);
    assert.equal(query.has('label[]'), false);
    assert.equal(query.get('cluster_id'), '7');
    assert.equal(query.get('page'), '1');
  });
}

for (const params of [{}, { cluster_id: 7 }]) {
  test(`label options uses its scoped lightweight endpoint: ${JSON.stringify(params)}`, async () => {
    const token = {};
    await api.queryWorkerLabelOptions(params, { token });
    assert.deepEqual(request.mock.calls.at(-1)!.arguments, [
      '/workers/label-options',
      {
        method: 'GET',
        params,
        cancelToken: token,
        skipErrorHandler: undefined
      }
    ]);
  });
}
