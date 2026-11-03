import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const userAtom = Symbol('user');
let currentUser: any;
let sessionStatus: number | 'network' = 200;
const clearAtomStorage = mock.fn(() => {
  currentUser = null;
});
const push = mock.fn();
const showError = mock.fn();
let handleError: any;
const request = mock.fn(async (url: string, options: any) => {
  if (sessionStatus === 200) return currentUser;
  const error = {
    message: 'Session check failed',
    config: { url },
    response:
      sessionStatus === 'network' ? undefined : { status: sessionStatus }
  };
  handleError(error, options);
  throw error;
});
mock.module('@umijs/max', {
  namedExports: { history: { push }, request }
});
mock.module('antd', { namedExports: { message: { error: showError } } });
mock.module(new URL('../atoms/user.ts', import.meta.url).href, {
  namedExports: { userAtom }
});
mock.module(new URL('../atoms/utils/index.ts', import.meta.url).href, {
  namedExports: { clearAtomStorage }
});
mock.module(
  new URL('../pages/_components/error-message-content.tsx', import.meta.url)
    .href,
  { defaultExport: () => null }
);
const { requestConfig } = await import('../request-config.tsx');
handleError = requestConfig.errorConfig!.errorHandler!;
const settle = () => new Promise((resolve) => setImmediate(resolve));
const failure = (url: string, status = 401) => ({
  message: `Request failed with status code ${status}`,
  config: { url },
  response: { status, data: { error: 'Unauthorized' } }
});

beforeEach(() => {
  currentUser = { id: 1, username: 'test-user' };
  sessionStatus = 200;
  [request, push, clearAtomStorage, showError].forEach((fn) =>
    fn.mock.resetCalls()
  );
});

for (const url of ['/v1/embeddings', '/v1/rerank', '/v1/models']) {
  test(`${url} 401 preserves a valid console session and surfaces the error`, async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      handleError(failure(url), {});
      await settle();
      assert.equal(clearAtomStorage.mock.calls.length, 0);
      assert.equal(push.mock.calls.length, 0);
      assert.equal(currentUser.username, 'test-user');
    }
    assert.equal(showError.mock.calls.length, 3);
    assert.equal(request.mock.calls.length, 3);
    assert.deepEqual(request.mock.calls[0].arguments, [
      '/users/me',
      { method: 'GET', skipErrorHandler: true }
    ]);
  });
}

test('an inference 401 still redirects when the console session has expired', async () => {
  sessionStatus = 401;
  handleError(failure('/v1/embeddings'), {});
  await settle();
  assert.equal(currentUser, null);
  assert.equal(request.mock.calls.length, 1);
  assert.equal(clearAtomStorage.mock.calls.length, 1);
  assert.deepEqual(push.mock.calls[0].arguments, ['/login', { replace: true }]);
  assert.equal(showError.mock.calls.length, 1);
});

for (const status of [403, 500, 'network'] as const) {
  test(`a ${status} session-check failure does not discard the console identity`, async () => {
    sessionStatus = status;
    handleError(failure('/v1/embeddings'), {});
    await settle();
    assert.equal(currentUser.username, 'test-user');
    assert.equal(clearAtomStorage.mock.calls.length, 0);
    assert.equal(push.mock.calls.length, 0);
    assert.equal(showError.mock.calls.length, 1);
  });
}

for (const url of ['/users/me', '/workers', '/v10/models']) {
  test(`${url} management 401 retains the login redirect`, () => {
    handleError(failure(url), {});
    assert.equal(currentUser, null);
    assert.equal(request.mock.calls.length, 0);
    assert.equal(push.mock.calls.length, 1);
  });
}

for (const status of [403, 429, 500]) {
  test(`an inference ${status} does not probe the session or redirect`, () => {
    handleError(failure('/v1/embeddings', status), {});
    assert.equal(request.mock.calls.length, 0);
    assert.equal(push.mock.calls.length, 0);
    assert.equal(showError.mock.calls.length, 1);
  });
}

test('skipErrorHandler suppresses the toast while still validating inference 401', async () => {
  handleError(failure('/v1/embeddings'), { skipErrorHandler: true });
  await settle();
  assert.equal(showError.mock.calls.length, 0);
  assert.equal(currentUser.username, 'test-user');
  assert.equal(request.mock.calls.length, 1);
  assert.equal(push.mock.calls.length, 0);
});
