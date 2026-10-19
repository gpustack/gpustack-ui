import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createTenantFetch } from '../tenant-fetch';

const tenantHeaders = mock.fn((_method?: string) => ({
  'X-Organization-Id': '42'
}));
const nativeFetch = mock.fn(
  async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{}')
);
const tenantFetch = createTenantFetch(
  nativeFetch,
  tenantHeaders,
  'https://gpustack.example/#/dashboard'
);

test('credential-free public fetch bypasses tenant context and keeps its token', async () => {
  nativeFetch.mock.resetCalls();
  tenantHeaders.mock.resetCalls();
  const options: RequestInit = {
    credentials: 'omit',
    headers: { 'X-Public-Token': 'test-public-token' }
  };
  await tenantFetch('/v2/public/example', options);
  assert.equal(tenantHeaders.mock.calls.length, 0);
  assert.equal(nativeFetch.mock.calls[0].arguments[1], options);
  assert.equal(new Headers(options.headers).get('X-Organization-Id'), null);
});

test('Request credentials and explicit init overrides choose the correct isolation', async () => {
  nativeFetch.mock.resetCalls();
  tenantHeaders.mock.resetCalls();
  const anonymous = new Request('https://gpustack.example/v2/public', {
    credentials: 'omit',
    headers: { 'X-Public-Token': 'test-token' }
  });
  await tenantFetch(anonymous);
  assert.equal(tenantHeaders.mock.calls.length, 0);
  assert.equal(nativeFetch.mock.calls[0].arguments[0], anonymous);

  await tenantFetch(anonymous, { credentials: 'same-origin' });
  const forwarded = nativeFetch.mock.calls[1].arguments[0] as Request;
  assert.equal(forwarded.headers.get('X-Organization-Id'), '42');
  assert.equal(forwarded.headers.get('X-Public-Token'), 'test-token');

  await tenantFetch(new Request('https://gpustack.example/v2/users/me'), {
    credentials: 'omit'
  });
  assert.equal(tenantHeaders.mock.calls.length, 1);
});

test('ordinary management fetch still receives tenant headers and cross-origin does not', async () => {
  nativeFetch.mock.resetCalls();
  await tenantFetch('/v2/clusters', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  });
  const options = nativeFetch.mock.calls[0].arguments[1];
  const headers = new Headers(options?.headers);
  assert.equal(headers.get('X-Organization-Id'), '42');
  assert.equal(headers.get('Content-Type'), 'application/json');
  assert.equal(tenantHeaders.mock.calls.at(-1)?.arguments[0], 'PATCH');

  const externalOptions = { credentials: 'include' as const };
  await tenantFetch('https://another.example/public', externalOptions);
  assert.equal(nativeFetch.mock.calls[1].arguments[1], externalOptions);
});
