import { atom } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, Fragment, useContext } from 'react';
import { createRoot } from 'react-dom/client';

const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const empty = () => null;
const ScrollSpyTabs = forwardRef((props: any, _ref) => passChildren(props));
const InputField = ({ value }: any) =>
  createElement('span', null, String(value ?? ''));
const modes = [
  { name: 'vllm-nixl', backends: ['vLLM'], display_name: 'vLLM + NIXL' },
  { name: 'sglang-nixl', backends: ['SGLang'], display_name: 'SGLang + NIXL' }
];
const defaultResolution = async ({ backend }: any) => ({
  mode: modes.find((mode) => mode.backends.includes(backend))?.name,
  vendor: 'NVIDIA',
  candidate_vendors: ['NVIDIA'],
  cluster_vendors: ['NVIDIA'],
  options: []
});
let resolveMode = defaultResolution;
const resolutionRequests = mock.fn((params: any) => resolveMode(params));
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
    Select: ({ value, onChange, options }: any) =>
      createElement(
        'select',
        {
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
  {
    namedExports: { ProviderValueMap: { Docker: 'Docker' } }
  }
);
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    resolvePDMode: resolutionRequests,
    queryPDModes: async () => ({ items: modes }),
    queryModelSpanningRoles: async () => null
  }
});
mock.module(
  new URL('../../hooks/use-query-backends.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      backendOptions: [],
      flatBackendOptions: ['vLLM', 'SGLang', 'llama-box'].map((value) => ({
        value,
        isBuiltIn: true
      })),
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
  {
    namedExports: { useQueryContextLength: () => ({}) }
  }
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
const { Form } = await import('antd');
const { FormContext } = await import('../../config/form-context.ts');
const { createDefaultRoles, rolesFormToPayload } =
  await import('../roles/transform.ts');
let context: any;
mock.module(new URL('../basic.tsx', import.meta.url).href, {
  defaultExport: () => {
    context = useContext(FormContext);
    return [
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
    );
  }
});
// Keep the real role tabs and their mount/unmount behavior. Override editors
// are irrelevant here; these leaves register the same identity fields.
const RoleFields = ({ index }: any) =>
  ['name', 'replicas'].map((field) =>
    createElement(
      Form.Item,
      { key: field, name: ['roles', index, field], hidden: true },
      createElement(InputField)
    )
  );
for (const path of ['../roles/role-form.tsx', '../roles/router-form.tsx']) {
  mock.module(new URL(path, import.meta.url).href, {
    defaultExport: RoleFields
  });
}
mock.module(new URL('../advance-config.tsx', import.meta.url).href, {
  defaultExport: ({ pdActive }: any) =>
    pdActive
      ? null
      : createElement(
          Form.Item,
          { name: 'lora_list', 'data-field': 'lora_list' },
          createElement(InputField)
        )
});
for (const path of [
  '../performance.tsx',
  '../schedule-type.tsx',
  '../scheduled-scaling.tsx',
  '../gather-locality.tsx'
]) {
  mock.module(new URL(path, import.meta.url).href, { defaultExport: empty });
}
const { default: DataForm } = await import('../index.tsx');

const renderForm = async (
  savedRoles = false,
  loraList: any[] = [],
  backend = 'vLLM'
) => {
  const root = createRoot(dom.window.document.getElementById('root')!);
  const ref: any = { current: null };
  const evaluated: any[] = [];
  const submitted = mock.fn((values: any) =>
    JSON.parse(JSON.stringify(values))
  );
  const initialValues: any = {
    backend,
    lora_list: loraList,
    cluster_id: 1,
    replicas: 1,
    source: 'local_path',
    name: 'model',
    ...(savedRoles
      ? { roles: createDefaultRoles(), disaggregation: { mode: 'vllm-nixl' } }
      : {})
  };
  await act(async () =>
    root.render(
      createElement(DataForm, {
        ref,
        initialValues,
        source: 'local_path',
        action: savedRoles || loraList.length ? 'edit' : 'create',
        formKey: 'deployment',
        isGGUF: false,
        clusterList: [],
        onOk: submitted,
        onBackendChange() {
          const values = ref.current.form.getFieldsValue(true);
          evaluated.push(rolesFormToPayload(values.roles, values));
        }
      })
    )
  );
  const toggle = async () => {
    await act(async () =>
      (
        dom.window.document.querySelector('[role="switch"]') as HTMLElement
      ).click()
    );
    // The enable handler waits for conditional fields to register before evaluation.
    await act(async () => new Promise((resolve) => setTimeout(resolve, 110)));
  };
  const changeBackend = async (backend: string) => {
    let pending: any;
    await act(async () => {
      ref.current.form.setFieldValue('backend', backend);
      pending = context.onBackendChange(backend, { isBuiltIn: true });
    });
    await act(async () => pending);
  };
  const submit = async () => {
    await act(async () => {
      await ref.current.form.validateFields();
      ref.current.submit();
    });
    return submitted.mock.calls.at(-1)?.result;
  };
  return { root, ref, evaluated, toggle, changeBackend, submit };
};

for (const savedRoles of [false, true]) {
  test(`backend round trip clears PD and allows rebuilding named roles (${savedRoles ? 'edit' : 'create'})`, async () => {
    const { root, ref, evaluated, toggle, changeBackend, submit } =
      await renderForm(savedRoles);
    try {
      if (!savedRoles) await toggle();
      assert.deepEqual(
        ref.current.form.getFieldValue('roles').map((role: any) => role.name),
        ['prefill', 'decode', 'router']
      );
      await changeBackend('llama-box');
      assert.equal(ref.current.form.getFieldValue('roles'), null);
      assert.equal(ref.current.form.getFieldValue('disaggregation'), null);
      await changeBackend('vLLM');
      assert.equal(
        dom.window.document
          .querySelector('[role="switch"]')
          ?.getAttribute('aria-checked'),
        'false'
      );
      assert.deepEqual(evaluated, [null, null]);
      const plainPayload = await submit();
      assert.equal(plainPayload.backend, 'vLLM');
      assert.equal(plainPayload.roles, null);
      assert.equal(plainPayload.disaggregation, null);
      await toggle();
      const values = ref.current.form.getFieldsValue(true);
      assert.deepEqual(
        rolesFormToPayload(values.roles, values)?.map((role) => role.name),
        ['prefill', 'decode', 'router']
      );
      assert.equal(values.disaggregation.mode, 'vllm-nixl');
      const pdPayload = await submit();
      assert.equal(pdPayload.disaggregation.mode, 'vllm-nixl');
      assert.deepEqual(
        pdPayload.roles.map(({ name, replicas }: any) => ({ name, replicas })),
        [
          { name: 'prefill', replicas: 1 },
          { name: 'decode', replicas: 1 },
          { name: 'router', replicas: 1 }
        ]
      );
      for (const role of pdPayload.roles) {
        for (const key of [
          'overrides',
          'scheduleType',
          'manualGpuMode',
          '__injected'
        ]) {
          assert.equal(Object.hasOwn(role, key), false);
        }
      }
    } finally {
      await act(async () => root.unmount());
    }
  });
}

test('switching between PD-capable backends preserves role edits', async () => {
  const { root, ref, toggle, changeBackend } = await renderForm();
  try {
    await toggle();
    await act(async () =>
      ref.current.form.setFieldValue(['roles', 0, 'replicas'], 4)
    );
    await changeBackend('SGLang');
    assert.equal(ref.current.form.getFieldValue(['roles', 0, 'replicas']), 4);
    assert.equal(
      ref.current.form.getFieldValue(['disaggregation', 'mode']),
      'sglang-nixl'
    );
    assert.equal(
      dom.window.document
        .querySelector('[role="switch"]')
        ?.getAttribute('aria-checked'),
      'true'
    );
  } finally {
    await act(async () => root.unmount());
  }
});

test('a late PD resolution cannot restore configuration after backend change', async () => {
  const { root, ref, toggle, changeBackend } = await renderForm();
  let finishResolution!: (value: any) => void;
  resolveMode = () =>
    new Promise((resolve) => {
      finishResolution = resolve;
    });
  try {
    await toggle();
    assert.ok(finishResolution);
    await changeBackend('llama-box');
    await act(async () =>
      finishResolution({ mode: 'vllm-nixl', vendor: 'NVIDIA' })
    );
    assert.equal(ref.current.form.getFieldValue('roles'), null);
    assert.equal(ref.current.form.getFieldValue('disaggregation'), null);
    await changeBackend('vLLM');
    assert.equal(
      dom.window.document
        .querySelector('[role="switch"]')
        ?.getAttribute('aria-checked'),
      'false'
    );
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

const loraList = [
  {
    lora_name: 'adapter',
    source: 'huggingface',
    lora_repo_name: 'org/adapter'
  }
];
const loraNotice = 'models.form.pd.lora.cleared';

for (const backend of ['vLLM', 'SGLang']) {
  test(`enabling PD on a LoRA deployment explains the disabled adapter (${backend})`, async () => {
    const { root, toggle } = await renderForm(false, loraList, backend);
    try {
      assert.ok(dom.window.document.querySelector('[data-field="lora_list"]'));
      assert.equal(
        dom.window.document.body.textContent?.includes(loraNotice),
        false
      );
      await toggle();
      assert.equal(
        dom.window.document.querySelector('[data-field="lora_list"]'),
        null
      );
      assert.ok(dom.window.document.body.textContent?.includes(loraNotice));
    } finally {
      await act(async () => root.unmount());
    }
  });

  test(`saving PD explicitly removes saved LoRA adapters after their field unmounts (${backend})`, async () => {
    const { root, toggle, submit } = await renderForm(false, loraList, backend);
    try {
      await toggle();
      const payload = await submit();
      assert.ok(payload.roles.length);
      assert.ok(payload.disaggregation.mode);
      assert.deepEqual(payload.lora_list, []);
    } finally {
      await act(async () => root.unmount());
    }
  });
}

test('enabling PD without adapters does not show a LoRA removal notice', async () => {
  const { root, toggle, submit } = await renderForm();
  try {
    await toggle();
    assert.equal(
      dom.window.document.body.textContent?.includes(loraNotice),
      false
    );
    assert.deepEqual((await submit()).lora_list, []);
  } finally {
    await act(async () => root.unmount());
  }
});

test('turning PD back off restores the adapters and removes the LoRA notice', async () => {
  const { root, toggle, submit } = await renderForm(false, loraList);
  try {
    await toggle();
    await toggle();
    assert.ok(dom.window.document.querySelector('[data-field="lora_list"]'));
    assert.equal(
      dom.window.document.body.textContent?.includes(loraNotice),
      false
    );
    const payload = await submit();
    assert.equal(payload.roles, null);
    assert.equal(payload.disaggregation, null);
    assert.equal(payload.lora_list[0].lora_name, loraList[0].lora_name);
    assert.equal(
      payload.lora_list[0].lora_repo_name,
      loraList[0].lora_repo_name
    );
  } finally {
    await act(async () => root.unmount());
  }
});
