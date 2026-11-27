import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

const calls: { path: string; options: any }[] = [];
let requestError: Error | undefined;
mock.module('@umijs/max', {
  namedExports: {
    request: async (path: string, options: any) => {
      calls.push({ path, options });
      if (requestError) throw requestError;
      return { id: 'native/id', deleted: true };
    }
  }
});
mock.module(new URL('../../../../config/settings.ts', import.meta.url).href, {
  namedExports: { GPUSTACK_API_BASE_URL: '/v2', OPENAI_COMPATIBLE: 'v1' }
});
mock.module(
  new URL('../../../../utils/fetch-chunk-data.ts', import.meta.url).href,
  {
    namedExports: { createFormData() {}, errorHandler() {} }
  }
);
const { cancelVideo, getVideo } = await import('../index');

test('cancel uses the public video ID without model headers or history flags', async () => {
  const signal = new AbortController().signal;
  await cancelVideo('native/id', signal);
  assert.equal(calls[0].path, '/v1/videos/native%2Fid');
  assert.equal(calls[0].options.method, 'DELETE');
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[0].options.headers, undefined);
  assert.equal(calls[0].options.params, undefined);
});

test('cancel errors never fall back to a GPUStack task-history endpoint', async () => {
  calls.length = 0;
  requestError = new Error('Engine unavailable');
  try {
    await assert.rejects(
      cancelVideo('native/id', new AbortController().signal),
      /Engine unavailable/
    );
    assert.deepEqual(
      calls.map((call) => call.path),
      ['/v1/videos/native%2Fid']
    );
  } finally {
    requestError = undefined;
  }
});

test('a status query preserves HTTP 404 when the engine includes a terminal job', async () => {
  requestError = Object.assign(new Error('Video not found'), {
    response: { status: 404, data: { id: 'missing', status: 'failed' } }
  });
  try {
    await assert.rejects(
      getVideo('missing', new AbortController().signal),
      (error) => error === requestError
    );
  } finally {
    requestError = undefined;
  }
});
