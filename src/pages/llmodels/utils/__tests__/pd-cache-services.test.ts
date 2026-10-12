import assert from 'node:assert/strict';
import test from 'node:test';
import type { PDMode, RoleFormItem } from '../../config/types';
import {
  clearUnsupportedPDCacheServices,
  pdBackendVersionWarning,
  supportsPDCacheService
} from '../pd-cache-services';

const nixl: PDMode = {
  name: 'vllm-nixl',
  display_name: 'vLLM + NIXL',
  backends: ['vLLM'],
  cache_services: [
    {
      provider: 'LMCache',
      backend_versions: '>=0.26.0',
      roles: {
        prefill: { kv_role: 'kv_both' },
        decode: { kv_role: 'kv_both' }
      }
    }
  ]
};
const mooncake: PDMode = {
  name: 'vllm-ascend-mooncake',
  display_name: 'Ascend Mooncake',
  backends: ['vLLM'],
  cache_services: [
    {
      provider: 'Mooncake',
      backend_versions: '>=0.23.0',
      roles: { prefill: {}, decode: {} }
    }
  ]
};

test('mode filters providers and admits Ascend 0.23 Decode', () => {
  const lmcache = { provider_name: 'LMCache' };
  const store = { provider_name: 'Mooncake' };
  assert.equal(supportsPDCacheService(lmcache, nixl, 'prefill'), true);
  assert.equal(supportsPDCacheService(store, nixl, 'prefill'), false);
  assert.equal(supportsPDCacheService(lmcache, mooncake, 'prefill'), false);
  assert.equal(supportsPDCacheService(store, mooncake, 'decode'), true);
});

test('cache service eligibility follows the declared roles', () => {
  const service = { provider_name: 'LMCache' };
  assert.equal(supportsPDCacheService(service, nixl, 'prefill'), true);
  assert.equal(supportsPDCacheService(service, nixl, 'decode'), true);
  assert.equal(supportsPDCacheService(service, nixl, 'router'), false);
});

test('absent catalog policy delegates compatibility; explicit empty policy denies services', () => {
  const service = { provider_name: 'Other' };
  assert.equal(supportsPDCacheService(service), true);
  assert.equal(
    supportsPDCacheService(service, {
      cache_services: []
    } as unknown as PDMode),
    false
  );
});

test('mode change clears incompatible service and preserves compatible or unknown selections', () => {
  const roles: RoleFormItem[] = [1, 2, 3].map((id) => ({
    name: 'prefill',
    replicas: 1,
    extended_kv_cache: { enabled: true, mode: 'shared', cache_service_id: id }
  }));
  const next = clearUnsupportedPDCacheServices(
    roles,
    (id) =>
      id === 3
        ? undefined
        : {
            provider_name: id === 1 ? 'LMCache' : 'Mooncake'
          },
    nixl
  );
  assert.equal(next[0], roles[0]);
  assert.equal(next[1].extended_kv_cache?.enabled, false);
  assert.equal(next[1].extended_kv_cache?.cache_service_id, undefined);
  assert.equal(next[2], roles[2]);
});

const backend = {
  isBuiltIn: true,
  versions: [
    { value: '0.25.3', label: '0.25.3', is_deprecated: true },
    { value: '0.29.0', label: '0.29.0', is_deprecated: false },
    { value: '0.25.3-custom', label: '0.25.3', is_deprecated: false }
  ]
};

for (const range of ['>=0.27.1', '>=0.26.0', '>=0.29.0']) {
  test(`built-in versions outside ${range} warn without removing cache choices`, () => {
    assert.equal(pdBackendVersionWarning(backend, '0.25.3', range), true);
    assert.equal(pdBackendVersionWarning(backend, '0.29.0', range), false);
    assert.equal(
      supportsPDCacheService({ provider_name: 'LMCache' }, nixl, 'prefill'),
      true
    );
  });
}

for (const [label, selected, version, image] of [
  ['Auto', backend, null, null],
  ['custom version', backend, '0.25.3-custom', null],
  ['custom image', backend, '0.25.3', 'my/vllm:patched'],
  ['unknown version', backend, '0.24.0', null],
  ['custom backend', { ...backend, isBuiltIn: false }, '0.25.3', null],
  ['options still loading', undefined, '0.25.3', null]
] as const) {
  test(`${label} does not show a built-in version warning`, () => {
    assert.equal(
      pdBackendVersionWarning(selected, version, '>=0.29.0', image),
      false
    );
  });
}

test('comma-separated ranges warn accurately; unknown ranges fail open', () => {
  assert.equal(
    pdBackendVersionWarning(backend, '0.29.0', '>=0.26.0,<0.29.0'),
    true
  );
  assert.equal(
    pdBackendVersionWarning(backend, '0.29.0', '>=0.26.0,<0.30.0'),
    false
  );
  assert.equal(pdBackendVersionWarning(backend, '0.25.3', 'unknown'), false);
});

for (const roles of [undefined, null]) {
  test(`a cache recipe with ${roles} roles does not admit a PD role`, () => {
    const mode = {
      ...nixl,
      cache_services: [{ provider: 'LMCache', roles }]
    } as unknown as PDMode;
    const service = { provider_name: 'LMCache' };
    assert.equal(supportsPDCacheService(service, mode, 'prefill'), false);
    assert.equal(supportsPDCacheService(service, mode), true);
  });
}
