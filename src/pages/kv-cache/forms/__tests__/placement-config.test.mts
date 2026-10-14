import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import type { CacheProviderItem, FormData } from '../../config/types';

mock.module('@gpustack/core-ui', {
  namedExports: { IconFont: () => null, GrafanaIcon: () => null, icons: {} }
});

const { placementConfig } = await import('../utils.ts');

const provider: CacheProviderItem = {
  name: 'test-cache',
  display_name: 'Test Cache',
  source: 'built_in',
  versions: {},
  inference_backend_integrations: []
};

test('placement fields resolve nested gates and include component dependencies only', () => {
  const config = placementConfig(
    {
      provider_name: provider.name,
      provider_version: '1.0.0',
      cluster_id: 3,
      worker_id: 7,
      worker_selector: { pool: 'cache' },
      config: {
        fields: { ha: false, stores: true, replicas: 4, ram: 18, unrelated: 99 }
      }
    },
    {
      ...provider,
      fields: [
        { name: 'ha', default: true },
        {
          name: 'stores',
          default: true,
          visible_by: 'ha',
          visible_when: true,
          gated_default: false
        },
        {
          name: 'replicas',
          default: 3,
          visible_by: 'stores',
          visible_when: true,
          gated_default: 1
        },
        {
          name: 'ram',
          default: 16,
          visible_by: 'stores',
          visible_when: true,
          gated_default: 0
        },
        { name: 'unrelated', default: 20 }
      ],
      components: {
        store: {
          replicas_by: 'replicas',
          enabled_by: 'stores',
          resource_profile: { ram_gib: '{{ ram }}' }
        }
      }
    }
  );

  assert.deepEqual(config, {
    provider_name: provider.name,
    provider_version: '1.0.0',
    cluster_id: 3,
    worker_id: 7,
    worker_selector: { pool: 'cache' },
    fields: { ha: false, stores: false, replicas: 1, ram: 0 }
  });
});

test('placement keeps false and zero, resolves undefined defaults and omits unset values', () => {
  assert.deepEqual(
    placementConfig(
      {
        config: {
          fields: {
            enabled: false,
            replicas: 0,
            ram: undefined,
            unset: null,
            empty: undefined,
            external: 24,
            unrelated: 99
          }
        }
      },
      {
        ...provider,
        fields: [
          { name: 'enabled', default: true },
          { name: 'replicas', default: 3 },
          { name: 'ram', default: 16 },
          { name: 'unset', default: 8 },
          { name: 'empty' }
        ],
        resource_profile: {
          ram_gib:
            '{{enabled}} {{replicas}} {{ram}} {{unset}} {{empty}} {{external}}'
        }
      }
    ),
    { fields: { enabled: false, replicas: 0, ram: 16, external: 24 } }
  );
});

test('undeclared dependencies fall back to form values when the provider has no fields', () => {
  assert.deepEqual(
    placementConfig(
      { config: { fields: { ram: 8, enabled: false, replicas: 0 } } },
      {
        ...provider,
        resource_profile: { ram_gib: '{{ram}}' },
        components: {
          store: { enabled_by: 'enabled', replicas_by: 'replicas' }
        }
      }
    ),
    { fields: { ram: 8, enabled: false, replicas: 0 } }
  );
});

test('each placement snapshot resolves the field table once and reads fresh defaults', () => {
  let reads = 0;
  let ram = 16;
  const countedProvider: CacheProviderItem = {
    ...provider,
    fields: [
      {
        name: 'ram',
        get default() {
          reads += 1;
          return ram;
        }
      },
      { name: 'enabled', default: true },
      { name: 'replicas', default: 2 }
    ],
    resource_profile: { ram_gib: '{{ram}}' },
    components: { store: { enabled_by: 'enabled', replicas_by: 'replicas' } }
  };

  assert.deepEqual(placementConfig({}, countedProvider), {
    fields: { ram: 16, enabled: true, replicas: 2 }
  });
  assert.equal(reads, 1);

  ram = 32;
  assert.deepEqual(placementConfig({}, countedProvider), {
    fields: { ram: 32, enabled: true, replicas: 2 }
  });
  assert.equal(reads, 2);
});

test('providers without placement dependencies skip field resolution', () => {
  let reads = 0;
  assert.deepEqual(
    placementConfig(
      {},
      {
        ...provider,
        fields: [
          {
            name: 'unrelated',
            get default() {
              reads += 1;
              return 16;
            }
          }
        ]
      }
    ),
    {}
  );
  assert.equal(reads, 0);
});

test('without a provider the projection retains form fields and strips unset entries', () => {
  const values: Partial<FormData> = {
    config: { fields: { enabled: false, replicas: 0, unset: null, empty: '' } }
  };
  assert.deepEqual(placementConfig(values), {
    fields: { enabled: false, replicas: 0 }
  });
});
