import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  pdCacheFeaturesFromInstances,
  pdCacheFeaturesFromModel
} from '../pd-cache-features';

test('role overrides replace the model parameter list while absent fields inherit; engine defaults stay unknown', () => {
  const features = pdCacheFeaturesFromModel({
    backend_parameters: ['--no-enable-prefix-caching'],
    extended_kv_cache: { enabled: false },
    roles: [
      {
        name: 'prefill',
        backend_parameters: ['--enable-prefix-caching'],
        extended_kv_cache: { enabled: true }
      },
      { name: 'decode' }
    ]
  });
  assert.deepEqual(features.prefill, { prefix: true, external: true });
  assert.deepEqual(features.decode, { prefix: false, external: undefined });
  assert.equal(
    pdCacheFeaturesFromModel({
      roles: [{ name: 'decode', backend_parameters: [] }],
      backend_parameters: ['--no-enable-prefix-caching']
    }).decode?.prefix,
    undefined
  );
});

test('explicit vLLM and SGLang switches are recognized without guessing defaults or resolving conflicting flags', () => {
  for (const parameters of [
    ['--enable-prefix-caching=false'],
    ['--enable-prefix-caching', 'False'],
    ['--disable-radix-cache']
  ])
    assert.equal(
      pdCacheFeaturesFromModel({ backend_parameters: parameters }).prefill
        ?.prefix,
      false
    );
  for (const parameters of [
    ['--enable-prefix-caching'],
    ['--disable-radix-cache=false'],
    ['--disaggregation-decode-enable-radix-cache']
  ])
    assert.equal(
      pdCacheFeaturesFromModel({ backend_parameters: parameters }).decode
        ?.prefix,
      true
    );
  for (const parameters of [
    null,
    [],
    ['--unknown'],
    ['--disable-radix-cache', '--enable-prefix-caching']
  ])
    assert.equal(
      pdCacheFeaturesFromModel({ backend_parameters: parameters }).prefill
        ?.prefix,
      undefined
    );
});

test('Benchmark cache visibility uses every recorded member of each role and never current model defaults', () => {
  const members = [
    {
      role: 'prefill',
      backend_parameters: ['--disable-radix-cache'],
      extended_kv_cache: { enabled: false }
    },
    {
      role: 'decode',
      backend_parameters: ['--enable-prefix-caching'],
      extended_kv_cache: { enabled: true }
    }
  ];
  const features = pdCacheFeaturesFromInstances(members);
  assert.deepEqual(features.prefill, { prefix: false, external: undefined });
  assert.deepEqual(features.decode, { prefix: true, external: true });
  assert.equal(
    pdCacheFeaturesFromInstances([
      ...members,
      {
        role: 'prefill',
        backend_parameters: [],
        extended_kv_cache: { enabled: false }
      }
    ]).prefill?.prefix,
    undefined
  );
  assert.equal(pdCacheFeaturesFromInstances([]).decode?.external, undefined);
});

test('manual connector configurations keep managed-cache-off ambiguous instead of hiding a custom external cache', () => {
  const features = pdCacheFeaturesFromModel({
    backend_parameters: [
      '--kv-transfer-config',
      '{"kv_connector":"LMCacheConnectorV1"}'
    ],
    extended_kv_cache: { enabled: false }
  });
  assert.equal(features.prefill?.external, undefined);
});

test('a legacy current-model fallback cannot hide historical cache measurements', () => {
  assert.equal(
    pdCacheFeaturesFromInstances([
      {
        role: 'prefill',
        config_source: 'current_model',
        backend_parameters: ['--no-enable-prefix-caching'],
        extended_kv_cache: { enabled: false }
      }
    ]).prefill?.prefix,
    undefined
  );
  assert.equal(
    pdCacheFeaturesFromModel({ extended_kv_cache: { enabled: false } }).decode
      ?.external,
    undefined,
    'PD remote KV queries are independent of managed offload cache'
  );
});
