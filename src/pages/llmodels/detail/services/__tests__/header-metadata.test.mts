import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

let cluster: unknown;
let targets: unknown;
let clusterError: unknown;
let targetError: unknown;
const request = mock.fn(async (url: string) => {
  if (url.startsWith('/clusters/')) {
    if (clusterError) throw clusterError;
    return cluster;
  }
  if (targetError) throw targetError;
  return { items: targets };
});
mock.module('@umijs/max', { namedExports: { request } });
mock.module(
  new URL('../../../../model-routes/config/index.ts', import.meta.url).href,
  { namedExports: { TargetStatusValueMap: { Active: 'active' } } }
);
const { queryHeaderMetadata } = await import('../header-metadata');
const reset = () => {
  request.mock.resetCalls();
  cluster = { id: 9, name: 'Readable cluster' };
  clusterError = undefined;
  targetError = undefined;
  targets = [
    { model_id: 99, state: 'active', route_name: 'foreign-route', route_id: 1 },
    { model_id: 7, state: 'unavailable', route_name: 'stopped', route_id: 2 },
    { model_id: 7, state: 'active', route_name: '', route_id: 3 },
    { model_id: 7, state: 'active', route_name: 'actual-route', route_id: 4 }
  ];
};

test('header lookup selects only an active named route of the current model', async () => {
  reset();
  const signal = new AbortController().signal;
  const result = await queryHeaderMetadata({ id: 7, cluster_id: 9 }, signal);
  assert.equal(result.clusterName, 'Readable cluster');
  assert.equal(result.target?.route_name, 'actual-route');
  assert.equal(result.target?.route_id, 4);
  assert.deepEqual(
    request.mock.calls.map((call) => call.arguments),
    [
      ['/clusters/9', { method: 'GET', signal, skipErrorHandler: true }],
      [
        '/model-route-targets',
        { method: 'GET', params: { page: -1 }, signal, skipErrorHandler: true }
      ]
    ]
  );
});

test('a denied cluster lookup preserves an independently authorized active route', async () => {
  reset();
  clusterError = { response: { status: 403 } };
  const result = await queryHeaderMetadata(
    { id: 7, cluster_id: 9 },
    new AbortController().signal
  );
  assert.equal(result.clusterName, null);
  assert.equal(result.target?.route_name, 'actual-route');
});

test('a denied route lookup removes serving actions without hiding cluster identity', async () => {
  reset();
  targetError = { response: { status: 403 }, message: 'private error body' };
  const result = await queryHeaderMetadata(
    { id: 7, cluster_id: 9 },
    new AbortController().signal
  );
  assert.equal(result.clusterName, 'Readable cluster');
  assert.equal(result.target, null);
  assert.ok(!JSON.stringify(result).includes('private error body'));
});

test('unexpected cluster IDs and malformed targets never become header metadata', async () => {
  reset();
  cluster = { id: 10, name: 'Other cluster' };
  targets = [{ model_id: 99, state: 'active', route_name: 'other-model' }];
  assert.deepEqual(
    await queryHeaderMetadata(
      { id: 7, cluster_id: 9 },
      new AbortController().signal
    ),
    { clusterName: null, target: null }
  );
});
