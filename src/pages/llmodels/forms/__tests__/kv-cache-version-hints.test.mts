import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { BackendOption, PDMode } from '../../config/types';

mock.module('@gpustack/core-ui', {
  namedExports: {
    CheckboxField: ({ checked, disabled, onChange, label }: any) =>
      createElement('input', {
        type: 'checkbox',
        'aria-label': label,
        checked: checked ?? false,
        disabled,
        onChange
      }),
    InputNumber: ({ value, onChange, label }: any) =>
      createElement('input', {
        type: 'number',
        'aria-label': label,
        value: value ?? '',
        onChange: (event: any) =>
          onChange?.(
            event.target.value === '' ? null : Number(event.target.value)
          )
      }),
    Select: ({ value, onChange, options, label }: any) =>
      createElement(
        'select',
        {
          'aria-label': label,
          value: value ?? '',
          onChange: (event: any) =>
            onChange(
              options.find(
                (option: any) => String(option.value) === event.target.value
              ).value
            )
        },
        options.map((option: any) =>
          createElement(
            'option',
            {
              key: option.value,
              value: option.value,
              disabled: option.disabled
            },
            option.label
          )
        )
      )
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }, values?: Record<string, any>) =>
        values ? `${id} ${JSON.stringify(values)}` : id
    })
  }
});

const services = [
  {
    label: 'Shared LMCache',
    value: 7,
    provider_name: 'LMCache',
    state: 'running',
    disabled: false
  },
  {
    label: 'Shared LMCache 0.5.4',
    value: 8,
    provider_name: 'LMCache',
    state: 'running',
    disabled: false
  },
  {
    label: 'Shared Mooncake',
    value: 9,
    provider_name: 'Mooncake',
    state: 'running',
    disabled: false
  }
];
mock.module(
  new URL('../../services/use-query-cache-services.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      cacheServiceOptions: services,
      loading: false,
      fetchCacheServices: async () => services
    })
  }
);
mock.module(new URL('../roles/override-section.tsx', import.meta.url).href, {
  namedExports: {
    RoleSection: ({ extra, children }: any) =>
      createElement('section', null, extra, children)
  }
});

const dom = new JSDOM('<!doctype html><body></body>', {
  url: 'http://localhost/'
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  Element: { configurable: true, value: dom.window.Element },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  getComputedStyle: { configurable: true, value: dom.window.getComputedStyle },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
dom.window.matchMedia = (media) => ({
  matches: false,
  media,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false
});
after(() => dom.window.close());

const { Form, Input } = await import('antd');
const { FormContext } = await import('../../config/form-context.ts');
const { default: KVCacheForm } = await import('../kv-cache.tsx');
const { default: RoleKVCache } = await import('../roles/role-kv-cache.tsx');
const { clearUnsupportedPDCacheServices } =
  await import('../../utils/pd-cache-services.ts');

const backend: BackendOption = {
  value: 'vLLM',
  label: 'vLLM',
  isBuiltIn: true,
  enabled: true,
  default_version: '0.29.0',
  default_backend_param: [],
  backend_source: 'built_in',
  versions: ['0.24.0', '0.29.0', '0.24.0-custom'].map((version) => ({
    value: version,
    label: version,
    is_deprecated: false
  }))
};
const mode: PDMode = {
  name: 'vllm-nixl',
  display_name: 'vLLM + NIXL',
  backends: ['vLLM'],
  in_process_cache_versions: '>=0.26.0',
  cache_services: [
    {
      provider: 'LMCache',
      backend_versions: '>=0.26.0',
      roles: { decode: {} }
    }
  ]
};

const mountCacheForm = async (
  version = '0.29.0',
  options: { role?: string; roleSection?: boolean; mode?: PDMode } = {}
) => {
  const container = dom.window.document.createElement('div');
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  let form!: FormInstance;
  let selectedMode = options.mode ?? mode;
  const role = options.role ?? 'decode';
  const clearIncompatibleCaches = () => {
    const roles = form.getFieldValue('roles');
    const next = clearUnsupportedPDCacheServices(
      roles,
      (id) => services.find((service) => service.value === id),
      selectedMode
    );
    if (next.some((role, index) => role !== roles[index])) {
      form.setFieldValue('roles', next);
    }
  };
  const Harness = () => {
    [form] = Form.useForm();
    return createElement(
      FormContext.Provider,
      {
        value: {
          flatBackendOptions: [backend],
          onValuesChange: clearIncompatibleCaches
        } as any
      },
      createElement(
        Form,
        {
          form,
          onValuesChange: clearIncompatibleCaches,
          initialValues: {
            backend: 'vLLM',
            backend_version: version,
            image_name: null,
            cluster_id: 2,
            roles: [
              {
                name: role,
                backend: null,
                backend_version: null,
                image_name: null,
                extended_kv_cache: {
                  enabled: true,
                  mode: 'shared',
                  cache_service_id: 7
                }
              }
            ]
          }
        },
        ...[
          'backend',
          'backend_version',
          'image_name',
          'cluster_id',
          ['roles', 0, 'backend'],
          ['roles', 0, 'backend_version'],
          ['roles', 0, 'image_name']
        ].map((name) =>
          createElement(
            Form.Item,
            { key: String(name), name, hidden: true },
            createElement(Input)
          )
        ),
        options.roleSection
          ? createElement(RoleKVCache, {
              mode: selectedMode,
              role,
              index: 0
            })
          : createElement(KVCacheForm, {
              mode: selectedMode,
              role,
              namePrefix: ['roles', 0],
              section: { label: 'Role KV cache' }
            })
      )
    );
  };
  await act(async () => root.render(createElement(Harness)));
  // Cache fields mount after the enabled watcher hydrates. Flush their
  // subscriptions before reading the selected cache and its version hint.
  await act(async () => {});
  return {
    container,
    form,
    changeMode: async (next: PDMode) => {
      await act(async () => {
        selectedMode = next;
        clearIncompatibleCaches();
        root.render(createElement(Harness));
      });
    },
    warnings: () =>
      Array.from(container.querySelectorAll('.ant-alert')).map(
        (alert) => alert.textContent || ''
      ),
    dispose: async () => {
      await act(async () => root.unmount());
      container.remove();
    }
  };
};

const assertChoicesEnabled = (container: HTMLElement) => {
  const select = container.querySelector('select')!;
  assert.equal(select.disabled, false);
  assert.deepEqual(
    Array.from(select.options).map((option) => [option.value, option.disabled]),
    [
      ['in-process', false],
      ['7', false],
      ['8', false]
    ]
  );
  assert.equal(
    container.querySelector<HTMLButtonElement>('button[role="switch"]')!
      .disabled,
    false
  );
};

const chooseCacheBackend = async (container: HTMLElement, value: string) => {
  await act(async () => {
    const select = container.querySelector('select')!;
    select.value = value;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 110));
  });
};

test('decode engine hints follow the selected built-in runner and allow submission', async () => {
  const view = await mountCacheForm('0.24.0');
  try {
    assert.equal(view.warnings().length, 1);
    assert.match(view.warnings()[0], /cacheServiceVersion\.below/);
    assert.match(view.warnings()[0], />=0\.26\.0/);
    assert.match(view.warnings()[0], /0\.24\.0/);
    assertChoicesEnabled(view.container);
    await act(async () => {
      await view.form.validateFields();
    });
    assert.equal(
      view.form.getFieldValue([
        'roles',
        0,
        'extended_kv_cache',
        'cache_service_id'
      ]),
      7
    );

    await act(async () => view.form.setFieldValue('backend_version', '0.29.0'));
    assert.deepEqual(view.warnings(), []);
    await act(async () => view.form.setFieldValue('backend_version', '0.24.0'));
    assert.match(view.warnings()[0], /cacheServiceVersion\.below/);
    await chooseCacheBackend(view.container, 'in-process');
    assert.match(view.warnings()[0], /inProcessVersion\.below/);
    await chooseCacheBackend(view.container, '7');
    assert.match(view.warnings()[0], /cacheServiceVersion\.below/);
    await act(async () => {
      await view.form.validateFields();
    });
  } finally {
    await view.dispose();
  }
});

test('custom images, custom versions and Auto suppress built-in engine hints', async () => {
  const view = await mountCacheForm('0.24.0');
  try {
    for (const [version, image] of [
      ['0.24.0', 'custom/vllm:latest'],
      ['0.24.0-custom', null],
      ['0.25.0', null],
      [null, null]
    ]) {
      await act(async () => {
        view.form.setFieldValue('backend_version', version);
        view.form.setFieldValue(['roles', 0, 'image_name'], image);
      });
      assert.deepEqual(view.warnings(), [], `${version}, ${image}`);
      assertChoicesEnabled(view.container);
      await act(async () => {
        await view.form.validateFields();
      });
    }
    await act(async () => view.form.setFieldValue('backend_version', '0.24.0'));
    assert.match(view.warnings()[0], /cacheServiceVersion\.below/);
  } finally {
    await view.dispose();
  }
});

test('switching local and shared cache updates engine hints without disabling choices', async () => {
  const view = await mountCacheForm('0.24.0');
  try {
    assert.match(view.warnings()[0], /cacheServiceVersion\.below/);
    for (const [value, hint, cacheMode] of [
      ['in-process', 'inProcessVersion.below', 'local'],
      ['7', 'cacheServiceVersion.below', 'shared']
    ]) {
      await chooseCacheBackend(view.container, value);
      assert.equal(view.warnings().length, 1);
      assert.ok(view.warnings()[0].includes(hint));
      assertChoicesEnabled(view.container);
      await act(async () => {
        await view.form.validateFields();
      });
      assert.equal(
        view.form.getFieldValue(['roles', 0, 'extended_kv_cache', 'mode']),
        cacheMode
      );
    }
  } finally {
    await view.dispose();
  }
});

test('a running LMCache 0.5.4 service stays selectable without a version warning', async () => {
  const view = await mountCacheForm();
  try {
    assert.deepEqual(view.warnings(), []);
    await chooseCacheBackend(view.container, '8');
    assert.deepEqual(view.warnings(), []);
    assertChoicesEnabled(view.container);
    await act(async () => {
      await view.form.validateFields();
    });
    assert.equal(
      view.form.getFieldValue([
        'roles',
        0,
        'extended_kv_cache',
        'cache_service_id'
      ]),
      8
    );

    await chooseCacheBackend(view.container, '7');
    assert.deepEqual(view.warnings(), []);
  } finally {
    await view.dispose();
  }
});

const toggleCache = async (container: HTMLElement) => {
  await act(async () => {
    container
      .querySelector<HTMLButtonElement>('button[role="switch"]')!
      .click();
    await new Promise((resolve) => setTimeout(resolve, 110));
  });
};

for (const providers of [[], ['Mooncake']]) {
  test(`a disabled role cache can be re-enabled after switching to a mode with ${providers.join(' or ') || 'no'} shared providers`, async () => {
    const view = await mountCacheForm();
    const nextMode: PDMode = {
      name: 'vllm-mooncake',
      display_name: 'vLLM + Mooncake',
      backends: ['vLLM'],
      cache_services: providers.map((provider) => ({
        provider,
        roles: { decode: {} }
      }))
    };
    try {
      await toggleCache(view.container);
      assert.equal(
        view.form.getFieldValue(['roles', 0, 'extended_kv_cache', 'enabled']),
        false
      );
      await view.changeMode(nextMode);
      await toggleCache(view.container);
      assert.equal(
        view.form.getFieldValue(['roles', 0, 'extended_kv_cache', 'enabled']),
        true
      );
      assert.equal(
        view.container
          .querySelector('button[role="switch"]')
          ?.getAttribute('aria-checked'),
        'true'
      );
      const choices = Array.from(
        view.container.querySelector('select')!.options
      ).map((option) => option.value);
      assert.deepEqual(
        choices,
        providers.length ? ['in-process', '9'] : ['in-process']
      );
      assert.notEqual(
        view.form.getFieldValue([
          'roles',
          0,
          'extended_kv_cache',
          'cache_service_id'
        ]),
        7
      );
      await chooseCacheBackend(view.container, 'in-process');
      assert.equal(
        view.form.getFieldValue(['roles', 0, 'extended_kv_cache', 'mode']),
        'local'
      );
      if (providers.length) {
        await chooseCacheBackend(view.container, '9');
        assert.equal(
          view.form.getFieldValue([
            'roles',
            0,
            'extended_kv_cache',
            'cache_service_id'
          ]),
          9
        );
      }
      await toggleCache(view.container);
      await toggleCache(view.container);
      assert.equal(
        view.form.getFieldValue(['roles', 0, 'extended_kv_cache', 'enabled']),
        true
      );
      await act(async () => {
        await view.form.validateFields();
      });
    } finally {
      await view.dispose();
    }
  });
}

test('re-enabling a role cache retains a shared service supported by the current mode', async () => {
  const view = await mountCacheForm();
  try {
    await chooseCacheBackend(view.container, '8');
    await toggleCache(view.container);
    await view.changeMode({ ...mode, name: 'another-lmcache-mode' });
    await toggleCache(view.container);
    assert.equal(
      view.form.getFieldValue(['roles', 0, 'extended_kv_cache', 'enabled']),
      true
    );
    assert.equal(
      view.form.getFieldValue([
        'roles',
        0,
        'extended_kv_cache',
        'cache_service_id'
      ]),
      8
    );
  } finally {
    await view.dispose();
  }
});

for (const name of [
  'vllm-nixl',
  'vllm-mooncake',
  'vllm-ascend-mooncake',
  'sglang-mooncake',
  'sglang-nixl',
  'custom'
]) {
  test(`${name} Decode hides cache controls and preserves saved configuration`, async () => {
    const view = await mountCacheForm('0.29.0', {
      roleSection: true,
      mode: { ...mode, name, cache_services: [] }
    });
    const savedCache = { enabled: true, mode: 'shared', cache_service_id: 7 };
    try {
      assert.equal(view.container.querySelector('button[role="switch"]'), null);
      assert.equal(view.container.querySelector('select'), null);
      assert.deepEqual(view.warnings(), []);
      await act(async () => {
        view.form.setFieldValue(['roles', 0, 'replicas'], 2);
        await view.form.validateFields();
      });
      assert.deepEqual(
        view.form.getFieldValue(['roles', 0, 'extended_kv_cache']),
        savedCache
      );
      assert.deepEqual(
        view.form.getFieldValue('roles')[0].extended_kv_cache,
        savedCache
      );
    } finally {
      await view.dispose();
    }
  });
}

test('Prefill keeps its editable role cache controls', async () => {
  const view = await mountCacheForm('0.29.0', {
    role: 'prefill',
    roleSection: true,
    mode: {
      ...mode,
      cache_services: [{ provider: 'LMCache', roles: { prefill: {} } }]
    }
  });
  try {
    assertChoicesEnabled(view.container);
    await chooseCacheBackend(view.container, 'in-process');
    assert.equal(
      view.form.getFieldValue(['roles', 0, 'extended_kv_cache', 'mode']),
      'local'
    );
  } finally {
    await view.dispose();
  }
});
