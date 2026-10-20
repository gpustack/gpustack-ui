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
