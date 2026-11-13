import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
let service: any = {
  id: 12,
  cluster_id: 9,
  name: 'Real cache',
  provider_name: 'LMCache'
};
let denied = false;
const request = mock.fn(async () => {
  if (denied) throw { response: { status: 403 }, message: 'private-body' };
  return service;
});
mock.module('@umijs/max', { namedExports: { request } });
mock.module(new URL('../header-metadata.ts', import.meta.url).href, {
  namedExports: {
    queryHeaderMetadata: async () => ({
      clusterName: 'Real cluster',
      target: { route_name: 'real-route' }
    })
  }
});
const { deploymentCacheBindings, queryDeploymentMetadata } =
  await import('../deployment-metadata');
const model: any = {
  id: 7,
  cluster_id: 9,
  extended_kv_cache: { enabled: true, mode: 'shared', cache_service_id: 12 },
  roles: [
    { name: 'prefill', extended_kv_cache: null },
    {
      name: 'decode',
      extended_kv_cache: {
        enabled: false,
        mode: 'shared',
        cache_service_id: 99
      }
    }
  ]
};
test('cache metadata preserves role inheritance and queries only enabled shared bindings', async () => {
  denied = false;
  request.mock.resetCalls();
  assert.deepEqual(deploymentCacheBindings(model), [
    { role: 'prefill', enabled: true, mode: 'shared', serviceId: 12 },
    { role: 'decode', enabled: false, mode: 'shared', serviceId: null }
  ]);
  const signal = new AbortController().signal;
  const result = await queryDeploymentMetadata(model, signal);
  assert.equal(result.cacheServices[12].name, 'Real cache');
  assert.equal(result.target?.route_name, 'real-route');
  assert.deepEqual(request.mock.calls[0].arguments, [
    '/cache-services/12',
    { method: 'GET', signal, skipErrorHandler: true }
  ]);
  assert.equal(request.mock.callCount(), 1);
});
test('denied or cross-cluster cache responses do not expose service metadata', async () => {
  denied = true;
  const deniedResult = await queryDeploymentMetadata(
    model,
    new AbortController().signal
  );
  assert.deepEqual(deniedResult.cacheServices, {});
  assert.ok(!JSON.stringify(deniedResult).includes('private-body'));
  denied = false;
  service = { id: 12, cluster_id: 10, name: 'Foreign cache' };
  assert.deepEqual(
    (await queryDeploymentMetadata(model, new AbortController().signal))
      .cacheServices,
    {}
  );
});
