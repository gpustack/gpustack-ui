import { atom } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, Fragment } from 'react';
import { createRoot } from 'react-dom/client';

const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const empty = () => null;
const ScrollSpyTabs = forwardRef((props: any, _ref) => passChildren(props));
const InputField = ({ value }: any) =>
  createElement('span', null, String(value ?? ''));
const modes = [
  { name: 'vllm-nixl', backends: ['vLLM'], display_name: 'vLLM + NIXL' },
  { name: 'custom', backends: [], display_name: 'Custom' }
];
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertBlockInfo: ({ message }: any) => createElement('div', null, message),
    CollapsePanel: ({ items }: any) =>
      items.map((item: any) =>
        createElement(Fragment, { key: item.key }, item.children)
      ),
    ScrollSpyTabs,
    IconFont: empty,
    LabelInfo: empty,
    Select: ({ value, onChange, options, label }: any) =>
      createElement(
        'select',
        {
          'aria-label': label,
          value: value ?? '',
          onChange: (event: any) => onChange(event.target.value)
        },
        createElement('option', { value: '' }),
        options?.map((option: any) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      ),
    useAppUtils: () => ({ getRuleMessage: (_: string, id: string) => id }),
    useWrapperContext: () => ({ getScrollElementScrollableHeight: () => 800 })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ messages: {}, formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    PageAction: { CREATE: 'create', EDIT: 'edit' },
    StatusMaps: {}
  }
});
mock.module(new URL('../../../../atoms/models.ts', import.meta.url).href, {
  namedExports: { workerListAtom: atom([]) }
});
mock.module(
  new URL('../../../cluster-management/config/index.ts', import.meta.url).href,
  { namedExports: { ProviderValueMap: { Docker: 'Docker' } } }
);
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    resolvePDMode: async () => ({
      mode: 'vllm-nixl',
      vendor: 'NVIDIA',
      candidate_vendors: ['NVIDIA'],
      cluster_vendors: ['NVIDIA'],
      options: []
    }),
    queryPDModes: async () => ({ items: modes }),
    queryModelSpanningRoles: async () => null
  }
});
mock.module(
  new URL('../../hooks/use-query-backends.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      backendOptions: [],
      flatBackendOptions: [{ value: 'vLLM', isBuiltIn: true }],
      getBackendOptions: async () => {}
    })
  }
);
mock.module(
  new URL('../../hooks/use-form-initial-values.ts', import.meta.url).href,
  {
    namedExports: {
      useGenerateGPUOptions: () => ({
        gpuOptions: [],
        workerLabelOptions: [],
        getGPUOptionList: async () => {}
      })
    }
  }
);
mock.module(
  new URL('../../services/use-query-context-length.ts', import.meta.url).href,
  { namedExports: { useQueryContextLength: () => ({}) } }
);

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Element: { configurable: true, value: dom.window.Element },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  getComputedStyle: {
    configurable: true,
    value: (element: Element) => dom.window.getComputedStyle(element)
  },
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

const { Form } = await import('antd');
const { createDefaultRoles } = await import('../roles/transform.ts');
mock.module(new URL('../basic.tsx', import.meta.url).href, {
  defaultExport: () =>
    [
      'backend',
      'backend_version',
      'cluster_id',
      'replicas',
      'name',
      'source'
    ].map((name) =>
      createElement(
        Form.Item,
        { key: name, name, hidden: true },
        createElement(InputField)
      )
    )
});

const cacheFields = [
  'enabled',
  'mode',
  'cache_service_id',
  'chunk_size',
  'ram_ratio',
  'ram_size'
];
// The real role tabs and Form preserve=false remain in the harness. These
// leaves reproduce RoleKVCache's conditional unmount: clearing before switching
// mode alone is insufficient because field cleanup restores saved edit values.
const RoleFields = ({ index, cacheDisabledReason }: any) => [
  ...['name', 'replicas', 'backend_parameters', 'env', 'worker_selector'].map(
    (field) =>
      createElement(
        Form.Item,
        { key: field, name: ['roles', index, field], hidden: true },
        createElement(InputField)
      )
  ),
  ...(!cacheDisabledReason
    ? cacheFields.map((field) =>
        createElement(
          Form.Item,
          {
            key: `cache-${field}`,
            name: ['roles', index, 'extended_kv_cache', field],
            hidden: true
          },
          createElement(InputField)
        )
      )
    : [])
];
for (const path of ['../roles/role-form.tsx', '../roles/router-form.tsx']) {
  mock.module(new URL(path, import.meta.url).href, {
    defaultExport: RoleFields
  });
}
for (const path of [
  '../advance-config.tsx',
  '../performance.tsx',
  '../schedule-type.tsx',
  '../scheduled-scaling.tsx',
  '../gather-locality.tsx'
]) {
  mock.module(new URL(path, import.meta.url).href, { defaultExport: empty });
}
const { default: DataForm } = await import('../index.tsx');

type CacheLocation = 'model' | 'prefill' | 'decode' | 'all' | 'none';
const clone = (value: any) => JSON.parse(JSON.stringify(value));
const cache = (id: number, enabled = true) => ({
  enabled,
  mode: 'shared',
  cache_service_id: id,
  chunk_size: 256,
  ram_ratio: 1.5,
  ram_size: 16
});

const renderForm = async (location: CacheLocation) => {
  const root = createRoot(dom.window.document.getElementById('root')!);
  const ref: any = { current: null };
  const submitted = mock.fn(clone);
  const roles = createDefaultRoles().map((role: any, index: number) => ({
    ...role,
    replicas: index + 2,
    backend_parameters: [`--role-${role.name}-argument=kept`],
    env: { USER_VARIABLE: role.name },
    worker_selector: { pool: role.name },
    overrides: { ...role.overrides, parameters: true, scheduling: true },
    extended_kv_cache: cache(
      index + 10,
      location === 'all' || location === role.name
    )
  }));
  await act(async () =>
    root.render(
      createElement(DataForm, {
        ref,
        initialValues: {
          backend: 'vLLM',
          cluster_id: 1,
          replicas: 1,
          source: 'local_path',
          name: 'model',
          roles,
          disaggregation: { mode: 'vllm-nixl' },
          extended_kv_cache: cache(
            5,
            location === 'model' || location === 'all'
          )
        },
        source: 'local_path',
        action: 'edit',
        formKey: 'deployment',
        isGGUF: false,
        clusterList: [],
        onOk: submitted
      })
    )
  );
  const selectMode = async (mode: string, settle = true) => {
    const select = dom.window.document.querySelector(
      'select[aria-label="models.form.pd.mode"]'
    ) as HTMLSelectElement;
    assert.ok(select, 'the real PD body must render its transport picker');
    await act(async () => {
      select.value = mode;
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    if (settle) {
      await act(async () => new Promise((resolve) => setTimeout(resolve, 120)));
    }
  };
  const selectedMode = () =>
    (
      dom.window.document.querySelector(
        'select[aria-label="models.form.pd.mode"]'
      ) as HTMLSelectElement
    ).value;
  const dialog = () => dom.window.document.querySelector('[role="dialog"]');
  const answerConfirmation = async (confirm: boolean) => {
    const modal = dialog();
    assert.ok(modal, 'active cache must require confirmation');
    const button = modal.querySelector(
      confirm ? 'button.ant-btn-primary' : 'button.ant-btn-default'
    ) as HTMLButtonElement;
    assert.ok(button, 'the confirmation must provide OK and Cancel actions');
    await act(async () => button.click());
    // Let the real modal finish closing and all field cleanups settle.
    await act(async () => new Promise((resolve) => setTimeout(resolve, 120)));
  };
  const values = () => clone(ref.current.form.getFieldsValue(true));
  const submit = async () => {
    await act(async () => {
      await ref.current.form.validateFields();
      ref.current.submit();
    });
    return submitted.mock.calls.at(-1)?.result;
  };
  const unmount = async () => {
    await act(async () => root.unmount());
  };
  return {
    ref,
    submitted,
    values,
    selectMode,
    selectedMode,
    dialog,
    answerConfirmation,
    submit,
    unmount
  };
};

const withoutCache = (roles: any[]) =>
  roles.map(({ extended_kv_cache, ...role }) => role);

for (const location of ['model', 'prefill', 'decode', 'all'] as const) {
  test(`Custom requires confirmation and cancellation preserves ${location} cache`, async () => {
    const form = await renderForm(location);
    try {
      const before = form.values();
      await form.selectMode('custom');
      assert.ok(form.dialog());
      assert.match(
        form.dialog()!.textContent!,
        /models\.form\.pd\.mode\.custom\.confirm\.title/
      );
      assert.deepEqual(form.values(), before);
      assert.equal(form.selectedMode(), 'vllm-nixl');
      assert.equal(form.submitted.mock.callCount(), 0);
      await form.answerConfirmation(false);
      assert.deepEqual(form.values(), before);
      assert.equal(form.selectedMode(), 'vllm-nixl');
      assert.equal(form.submitted.mock.callCount(), 0);
    } finally {
      await form.unmount();
    }
  });
}

test('confirming Custom clears model and every role cache after saved fields unmount', async () => {
  const form = await renderForm('all');
  try {
    const before = form.values();
    await form.selectMode('custom');
    await form.answerConfirmation(true);
    const after = form.values();
    assert.equal(after.disaggregation.mode, 'custom');
    assert.equal(
      form.ref.current.form.getFieldsValue().roles[0]?.extended_kv_cache,
      undefined,
      'Custom must have unmounted the saved prefill cache fields'
    );
    assert.deepEqual(after.extended_kv_cache, { enabled: false });
    for (const role of after.roles) {
      assert.deepEqual(role.extended_kv_cache, { enabled: false });
    }
    assert.deepEqual(withoutCache(after.roles), withoutCache(before.roles));
    assert.equal(form.submitted.mock.callCount(), 0);

    const payload = await form.submit();
    assert.equal(payload.disaggregation.mode, 'custom');
    assert.deepEqual(payload.extended_kv_cache, { enabled: false });
    for (const role of payload.roles) {
      assert.deepEqual(role.extended_kv_cache, { enabled: false });
      assert.deepEqual(role.env, { USER_VARIABLE: role.name });
      assert.deepEqual(role.backend_parameters, [
        `--role-${role.name}-argument=kept`
      ]);
      assert.deepEqual(role.worker_selector, { pool: role.name });
    }
    assert.equal(form.submitted.mock.callCount(), 1);

    await form.selectMode('vllm-nixl');
    const roundTrip = form.values();
    assert.equal(roundTrip.disaggregation.mode, 'vllm-nixl');
    assert.deepEqual(roundTrip.extended_kv_cache, { enabled: false });
    for (const role of roundTrip.roles) {
      assert.deepEqual(role.extended_kv_cache, { enabled: false });
    }
    assert.deepEqual(withoutCache(roundTrip.roles), withoutCache(before.roles));
  } finally {
    await form.unmount();
  }
});

test('saving a confirmed Custom to built-in round trip keeps all caches disabled', async () => {
  const form = await renderForm('all');
  try {
    await form.selectMode('custom');
    await form.answerConfirmation(true);
    await form.selectMode('vllm-nixl');
    assert.equal(form.submitted.mock.callCount(), 0);
    const payload = await form.submit();
    assert.equal(payload.disaggregation.mode, 'vllm-nixl');
    assert.deepEqual(payload.extended_kv_cache, { enabled: false });
    for (const role of payload.roles) {
      assert.deepEqual(role.extended_kv_cache, { enabled: false });
    }
  } finally {
    await form.unmount();
  }
});

test('Custom switches directly when every cache is disabled', async () => {
  const form = await renderForm('none');
  try {
    await form.selectMode('custom');
    assert.equal(form.dialog(), null);
    const after = form.values();
    assert.equal(after.disaggregation.mode, 'custom');
    assert.deepEqual(after.extended_kv_cache, { enabled: false });
    for (const role of after.roles) {
      assert.deepEqual(role.extended_kv_cache, { enabled: false });
    }
    assert.equal(form.submitted.mock.callCount(), 0);
    const payload = await form.submit();
    assert.equal(payload.disaggregation.mode, 'custom');
    assert.deepEqual(payload.extended_kv_cache, { enabled: false });
    assert.equal(form.submitted.mock.callCount(), 1);
  } finally {
    await form.unmount();
  }
});

test('a pending Custom cleanup cannot erase a new cache after returning to a built-in mode', async (context) => {
  const form = await renderForm('none');
  context.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    await form.selectMode('custom', false);
    await form.selectMode('vllm-nixl', false);
    const newCache = cache(91);
    await act(async () =>
      form.ref.current.form.setFieldValue(
        ['roles', 0, 'extended_kv_cache'],
        newCache
      )
    );
    await act(async () => context.mock.timers.tick(100));
    assert.equal(form.values().disaggregation.mode, 'vllm-nixl');
    assert.deepEqual(form.values().roles[0].extended_kv_cache, newCache);
    const payload = await form.submit();
    assert.deepEqual(payload.roles[0].extended_kv_cache, newCache);
  } finally {
    await form.unmount();
    context.mock.timers.reset();
  }
});
