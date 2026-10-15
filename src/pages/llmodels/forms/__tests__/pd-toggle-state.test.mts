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
  { name: 'vllm-nixl', backends: ['vLLM'], display_name: 'vLLM + NIXL' }
];
let loadCatalog = async () => ({ items: modes });
const defaultResolution = async () => ({
  mode: 'vllm-nixl',
  vendor: 'NVIDIA',
  candidate_vendors: ['NVIDIA'],
  cluster_vendors: ['NVIDIA'],
  options: []
});
let resolveMode = defaultResolution;

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
    AutoComplete: InputField,
    CheckboxField: InputField,
    Input: { Input: InputField },
    InputNumber: InputField,
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
    resolvePDMode: () => resolveMode(),
    queryPDModes: () => loadCatalog(),
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
const { FormContext } = await import('../../config/form-context.ts');
const { createDefaultRoles } = await import('../roles/transform.ts');
let formContext: any;
mock.module(new URL('../basic.tsx', import.meta.url).href, {
  defaultExport: () => {
    formContext = useContext(FormContext);
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

const cacheFields = [
  'enabled',
  'mode',
  'cache_service_id',
  'chunk_size',
  'ram_ratio',
  'ram_size'
];
// Keep the real Form, PD control, and role tabs. These leaves reproduce the
// model-cache and saved-role registrations that restore initialValues on
// unmount when the deployment Form has preserve=false.
mock.module(
  new URL('../../hooks/use-query-draftModels.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      draftModelList: [],
      loading: false,
      resetDraftModels() {},
      onSearch() {}
    })
  }
);
mock.module(new URL('../roles/override-section.tsx', import.meta.url).href, {
  namedExports: { RoleSection: passChildren }
});
const { default: SpeculativeDecode } =
  await import('../speculative-decode.tsx');
mock.module(new URL('../performance.tsx', import.meta.url).href, {
  defaultExport: () =>
    createElement(
      'div',
      { 'data-panel': 'performance' },
      cacheFields.map((field) =>
        createElement(
          Form.Item,
          { key: field, name: ['extended_kv_cache', field], hidden: true },
          createElement(InputField)
        )
      ),
      createElement(SpeculativeDecode)
    )
});
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
mock.module(new URL('../schedule-type.tsx', import.meta.url).href, {
  defaultExport: () =>
    createElement(
      'div',
      { 'data-panel': 'scheduling' },
      [
        'gpu_selector',
        'gpu_type_selector',
        'worker_selector',
        'placement_strategy',
        'scheduleType',
        'manualGpuMode'
      ].map((name) =>
        createElement(
          Form.Item,
          { key: name, name, hidden: true },
          createElement(InputField)
        )
      )
    )
});
mock.module(new URL('../advance-config.tsx', import.meta.url).href, {
  defaultExport: ({ pdActive }: any) =>
    [
      'image_name',
      'run_command',
      ...(!pdActive ? ['backend_parameters', 'env', 'lora_list'] : [])
    ].map((name) =>
      createElement(
        Form.Item,
        { key: name, name, hidden: true },
        createElement(InputField)
      )
    )
});
mock.module(new URL('../scheduled-scaling.tsx', import.meta.url).href, {
  defaultExport: () =>
    createElement(
      Form.Item,
      { name: 'scaling_schedule', hidden: true },
      createElement(InputField)
    )
});
mock.module(new URL('../gather-locality.tsx', import.meta.url).href, {
  defaultExport: empty
});
const { default: DataForm } = await import('../index.tsx');

const clone = (value: any) => JSON.parse(JSON.stringify(value));
const ordinaryCache = {
  enabled: true,
  mode: 'shared',
  cache_service_id: 5,
  chunk_size: 256,
  ram_ratio: 1.5,
  ram_size: 16
};

const renderForm = async (savedPD = false, catalog = false) => {
  const root = createRoot(dom.window.document.getElementById('root')!);
  const ref: any = { current: null };
  const submitted = mock.fn(clone);
  const evaluated = mock.fn((_changedValues: any, values: any) =>
    clone(values)
  );
  await act(async () =>
    root.render(
      createElement(DataForm, {
        ref,
        initialValues: catalog
          ? undefined
          : {
              backend: 'vLLM',
              cluster_id: 1,
              replicas: 1,
              source: 'local_path',
              name: 'model',
              roles: savedPD ? createDefaultRoles() : null,
              disaggregation: savedPD
                ? { mode: 'vllm-nixl', vendor: 'NVIDIA' }
                : null,
              extended_kv_cache: savedPD
                ? { enabled: false }
                : clone(ordinaryCache)
            },
        source: 'local_path',
        action: catalog ? 'create' : 'edit',
        formKey: catalog ? 'catalog' : 'deployment',
        isGGUF: false,
        clusterList: [],
        onOk: submitted,
        onValuesChange: evaluated
      })
    )
  );
  const toggle = async () => {
    await act(async () =>
      (
        dom.window.document.querySelector('[role="switch"]') as HTMLElement
      ).click()
    );
  };
  const values = () => clone(ref.current.form.getFieldsValue(true));
  const switchChecked = () =>
    dom.window.document
      .querySelector('[role="switch"]')!
      .getAttribute('aria-checked');
  const panelVisible = (panel: string) =>
    !!dom.window.document.querySelector(`[data-panel="${panel}"]`);
  const submit = async () => {
    const previousCalls = submitted.mock.callCount();
    await act(async () => {
      await ref.current.form.validateFields();
      ref.current.submit();
    });
    assert.equal(submitted.mock.callCount(), previousCalls + 1);
    return submitted.mock.calls.at(-1)!.result;
  };
  const unmount = async () => {
    await act(async () => root.unmount());
  };
  const applyCatalogSpec = async (values: any) => {
    await act(async () => {
      ref.current.applyCatalogSpec(values);
    });
  };
  return {
    ref,
    evaluated,
    values,
    toggle,
    switchChecked,
    panelVisible,
    applyCatalogSpec,
    submit,
    unmount
  };
};

// This runs before the real catalog hook has cached its first response.
test('a delayed saved-PD catalog response cannot enable PD after it is turned off', async () => {
  let releaseCatalog!: (response: { items: typeof modes }) => void;
  loadCatalog = () =>
    new Promise((resolve) => {
      releaseCatalog = resolve;
    });
  const form = await renderForm(true);
  try {
    assert.equal(form.switchChecked(), 'true');
    await form.toggle();
    await act(async () => releaseCatalog({ items: modes }));
    assert.equal(form.switchChecked(), 'false');
    assert.equal(form.values().roles, null);
    assert.equal(form.values().disaggregation, null);
    assert.equal(form.panelVisible('performance'), true);
    const payload = await form.submit();
    assert.equal(payload.roles, null);
    assert.equal(payload.disaggregation, null);
  } finally {
    await form.unmount();
    loadCatalog = async () => ({ items: modes });
  }
});

test('enabling PD clears the saved model cache after Performance unmounts', async () => {
  const form = await renderForm();
  try {
    assert.deepEqual(form.values().extended_kv_cache, ordinaryCache);
    assert.equal(form.panelVisible('performance'), true);
    await form.toggle();
    assert.equal(form.switchChecked(), 'true');
    assert.equal(form.panelVisible('performance'), false);
    assert.deepEqual(form.values().extended_kv_cache, { enabled: false });

    const payload = await form.submit();
    assert.equal(payload.disaggregation.mode, 'vllm-nixl');
    assert.equal(payload.roles.length, 3);
    assert.deepEqual(payload.extended_kv_cache, { enabled: false });
  } finally {
    await form.unmount();
  }
});

test('automatic PD resolution publishes its mode and vendor for evaluation', async () => {
  let releaseResolution!: (
    response: Awaited<ReturnType<typeof defaultResolution>>
  ) => void;
  resolveMode = () =>
    new Promise((resolve) => {
      releaseResolution = resolve;
    });
  const form = await renderForm();
  try {
    await form.toggle();
    assert.equal(typeof releaseResolution, 'function');
    const callsBeforeResolution = form.evaluated.mock.callCount();
    assert.ok(callsBeforeResolution > 0, 'the toggle must trigger evaluation');
    await act(async () => releaseResolution(await defaultResolution()));
    assert.deepEqual(form.values().disaggregation, {
      mode: 'vllm-nixl',
      vendor: 'NVIDIA'
    });
    assert.ok(
      form.evaluated.mock.callCount() > callsBeforeResolution,
      'the resolved automatic transport must trigger evaluation'
    );
    const evaluated = form.evaluated.mock.calls.at(-1)!.result;
    assert.deepEqual(evaluated.disaggregation, {
      mode: 'vllm-nixl',
      vendor: 'NVIDIA'
    });
    assert.equal(evaluated.roles.length, 3);
    assert.deepEqual(form.values().extended_kv_cache, { enabled: false });
  } finally {
    await form.unmount();
    resolveMode = defaultResolution;
  }
});

test('opening saved PD preserves its transport without triggering evaluation', async () => {
  const form = await renderForm(true);
  try {
    assert.deepEqual(form.values().disaggregation, {
      mode: 'vllm-nixl',
      vendor: 'NVIDIA'
    });
    assert.equal(form.evaluated.mock.callCount(), 0);
  } finally {
    await form.unmount();
  }
});

test('disabling saved PD keeps the switch, store, panels, and payload off', async () => {
  const form = await renderForm(true);
  try {
    assert.equal(form.switchChecked(), 'true');
    await form.toggle();
    assert.equal(form.switchChecked(), 'false');
    assert.equal(form.values().roles, null);
    assert.equal(form.values().disaggregation, null);
    assert.equal(form.panelVisible('performance'), true);
    assert.equal(form.panelVisible('scheduling'), true);
    assert.equal(
      dom.window.document.querySelector(
        'select[aria-label="models.form.pd.mode"]'
      ),
      null
    );

    const payload = await form.submit();
    assert.equal(payload.roles, null);
    assert.equal(payload.disaggregation, null);
  } finally {
    await form.unmount();
  }
});

test('a PD round trip restores the original ordinary model cache', async () => {
  const form = await renderForm();
  try {
    await form.toggle();
    await form.toggle();
    assert.equal(form.switchChecked(), 'false');
    assert.deepEqual(form.values().extended_kv_cache, ordinaryCache);
    assert.equal(form.values().roles, null);
    assert.equal(form.values().disaggregation, null);
    const payload = await form.submit();
    assert.deepEqual(payload.extended_kv_cache, ordinaryCache);
  } finally {
    await form.unmount();
  }
});

test('pending enable cleanup cannot erase cache edited after quickly disabling PD', async (context) => {
  const form = await renderForm();
  context.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    await form.toggle();
    await form.toggle();
    const newCache = { ...ordinaryCache, cache_service_id: 91 };
    await act(async () =>
      form.ref.current.form.setFieldValue('extended_kv_cache', newCache)
    );
    await act(async () => context.mock.timers.tick(100));
    assert.equal(form.switchChecked(), 'false');
    assert.deepEqual(form.values().extended_kv_cache, newCache);
    assert.equal(form.values().roles, null);
    assert.equal(form.values().disaggregation, null);
    const payload = await form.submit();
    assert.deepEqual(payload.extended_kv_cache, newCache);
  } finally {
    await form.unmount();
    context.mock.timers.reset();
  }
});

const modelFields = [
  'backend_parameters',
  'env',
  'worker_selector',
  'gpu_selector',
  'gpu_type_selector',
  'extended_kv_cache',
  'lora_list',
  'placement_strategy'
];
const modelValues = (values: any) =>
  Object.fromEntries(modelFields.map((name) => [name, values[name]]));
const ordinaryDefaults = {
  backend_parameters: [],
  env: {},
  worker_selector: {},
  gpu_selector: null,
  gpu_type_selector: null,
  extended_kv_cache: { enabled: false },
  lora_list: [],
  placement_strategy: 'spread'
};
const clearedPDValues = { ...ordinaryDefaults, placement_strategy: undefined };
const catalogSpec = (name: 'A' | 'B') => ({
  backend: 'vLLM',
  cluster_id: 1,
  replicas: name === 'A' ? 4 : 7,
  source: name === 'A' ? 'local_path' : 'huggingface',
  name: `model-${name}`,
  backend_parameters: [`--max-model-len=${name === 'A' ? 1024 : 4096}`],
  env: name === 'A' ? { A_ONLY: 'A', COMMON: 'A' } : { B_ONLY: 'B' },
  worker_selector: name === 'A' ? { pool: 'A', obsolete: 'A' } : { pool: 'B' },
  gpu_selector: {
    gpu_ids: [[`worker-${name}`, `${name}:gpu:0`]],
    gpus_per_replica: name === 'A' ? 1 : 2
  },
  gpu_type_selector: { type: `type-${name}` },
  extended_kv_cache: {
    ...ordinaryCache,
    cache_service_id: name === 'A' ? 51 : 92
  },
  lora_list: [{ lora_name: `adapter-${name}`, source: 'huggingface' }],
  placement_strategy: name === 'A' ? 'spread' : 'binpack'
});
const runtimeB = {
  backend_version: null,
  image_name: 'model-b:latest',
  run_command: 'serve-b'
};
const applyRuntimeB = async (form: Awaited<ReturnType<typeof renderForm>>) => {
  await act(async () => form.ref.current.applyRuntimeChoice(runtimeB));
};
const assertSpecBPayload = (
  payload: any,
  specB: ReturnType<typeof catalogSpec>
) => {
  assert.deepEqual(payload.backend_parameters, specB.backend_parameters);
  assert.deepEqual(payload.env, specB.env);
  assert.deepEqual(payload.extended_kv_cache, specB.extended_kv_cache);
  assert.deepEqual(payload.gpu_selector, {
    gpu_ids: ['B:gpu:0'],
    gpus_per_replica: 2
  });
  // Selecting individual GPUs makes the worker and GPU-type selectors
  // mutually exclusive on the wire; the store above still holds spec B.
  assert.equal(payload.worker_selector, null);
  assert.equal(payload.gpu_type_selector, null);
  assert.deepEqual(
    payload.lora_list.map((adapter: any) => adapter.lora_name),
    ['adapter-B']
  );
  assert.equal(payload.placement_strategy, 'binpack');
  assert.equal(payload.image_name, runtimeB.image_name);
  assert.equal(payload.run_command, runtimeB.run_command);
  assert.equal(payload.source, specB.source);
  assert.equal(payload.name, specB.name);
  assert.equal(payload.roles, null);
  assert.equal(payload.disaggregation, null);
};

test('replacing a catalog spec while PD is on restores the new ordinary settings', async () => {
  const form = await renderForm(false, true);
  const specB = catalogSpec('B');
  try {
    await form.applyCatalogSpec(catalogSpec('A'));
    await form.toggle();
    await form.applyCatalogSpec(specB);
    await applyRuntimeB(form);
    assert.equal(form.switchChecked(), 'true');
    assert.deepEqual(modelValues(form.values()), clearedPDValues);
    assert.equal(form.values().replicas, 1);

    await form.toggle();
    assert.equal(form.switchChecked(), 'false');
    assert.deepEqual(modelValues(form.values()), modelValues(specB));
    assertSpecBPayload(await form.submit(), specB);
  } finally {
    await form.unmount();
  }
});

test('a catalog spec with omitted model settings replaces every stale PD snapshot value', async () => {
  const form = await renderForm(false, true);
  try {
    await form.applyCatalogSpec(catalogSpec('A'));
    await form.toggle();
    await form.applyCatalogSpec({
      backend: 'vLLM',
      cluster_id: 1,
      source: 'huggingface',
      name: 'model-B',
      replicas: 7
    });
    await applyRuntimeB(form);
    assert.deepEqual(modelValues(form.values()), clearedPDValues);
    assert.equal(form.values().replicas, 1);

    await form.toggle();
    assert.deepEqual(modelValues(form.values()), ordinaryDefaults);
    const payload = await form.submit();
    assert.deepEqual(modelValues(payload), ordinaryDefaults);
    assert.equal(payload.image_name, runtimeB.image_name);
    assert.equal(payload.run_command, runtimeB.run_command);
    assert.equal(payload.source, 'huggingface');
    assert.equal(payload.roles, null);
    assert.equal(payload.disaggregation, null);
  } finally {
    await form.unmount();
  }
});

test('replacing an ordinary catalog spec preserves only its new settings through a PD round trip', async () => {
  const form = await renderForm(false, true);
  const specB = catalogSpec('B');
  try {
    await form.applyCatalogSpec(catalogSpec('A'));
    await form.applyCatalogSpec(specB);
    await applyRuntimeB(form);
    assert.deepEqual(modelValues(form.values()), modelValues(specB));
    await form.toggle();
    await form.toggle();
    assert.deepEqual(modelValues(form.values()), modelValues(specB));
    assertSpecBPayload(await form.submit(), specB);
  } finally {
    await form.unmount();
  }
});

const speculativeA = {
  enabled: true,
  algorithm: 'eagle3',
  draft_model: 'org/draft-A',
  num_draft_tokens: 17,
  ngram_min_match_length: 3,
  ngram_max_match_length: 9
};
const speculativeB = {
  enabled: true,
  algorithm: 'ngram',
  num_draft_tokens: 6,
  ngram_min_match_length: 2,
  ngram_max_match_length: 7
};

test('a PD round trip restores ordinary speculative decoding after its real fields unmount', async () => {
  const form = await renderForm();
  try {
    await act(async () =>
      form.ref.current.form.setFieldValue('speculative_config', speculativeB)
    );
    await form.toggle();
    assert.deepEqual(form.values().speculative_config, { enabled: false });
    const pdPayload = await form.submit();
    assert.deepEqual(pdPayload.speculative_config, { enabled: false });
    await form.toggle();
    assert.deepEqual(form.values().speculative_config, speculativeB);
    const payload = await form.submit();
    assert.deepEqual(payload.speculative_config, speculativeB);
  } finally {
    await form.unmount();
  }
});

for (const replacement of ['omitted', 'partial'] as const) {
  test(`replacing catalog speculative decoding with ${replacement} settings drops all previous settings`, async () => {
    const form = await renderForm(false, true);
    try {
      await form.applyCatalogSpec({
        ...catalogSpec('A'),
        speculative_config: speculativeA
      });
      await form.applyCatalogSpec({
        ...catalogSpec('B'),
        ...(replacement === 'partial'
          ? { speculative_config: { enabled: true, algorithm: 'mtp' } }
          : {})
      });
      const assertReplacement = (config: any) => {
        assert.equal(config.enabled, replacement === 'partial');
        if (replacement === 'partial') {
          assert.equal(config.algorithm, 'mtp');
        }
        assert.notEqual(config.draft_model, speculativeA.draft_model);
        assert.notEqual(config.num_draft_tokens, speculativeA.num_draft_tokens);
        assert.notEqual(
          config.ngram_min_match_length,
          speculativeA.ngram_min_match_length
        );
        assert.notEqual(
          config.ngram_max_match_length,
          speculativeA.ngram_max_match_length
        );
      };
      assertReplacement(form.values().speculative_config);
      await form.toggle();
      await form.toggle();
      assertReplacement(form.values().speculative_config);
      const payload = await form.submit();
      assertReplacement(payload.speculative_config);
      if (replacement === 'omitted') {
        assert.deepEqual(payload.speculative_config, { enabled: false });
      }
    } finally {
      await form.unmount();
    }
  });
}

test('a catalog speculative setting selected while PD is on is restored after disabling PD', async () => {
  const form = await renderForm(false, true);
  try {
    await form.applyCatalogSpec({
      ...catalogSpec('A'),
      speculative_config: speculativeA
    });
    await form.toggle();
    await form.applyCatalogSpec({
      ...catalogSpec('B'),
      speculative_config: speculativeB
    });
    assert.deepEqual(form.values().speculative_config, { enabled: false });
    await form.toggle();
    assert.deepEqual(form.values().speculative_config, speculativeB);
    const payload = await form.submit();
    assert.deepEqual(payload.speculative_config, speculativeB);
    assert.equal(payload.replicas, 7);
  } finally {
    await form.unmount();
  }
});

for (const replicas of [4, 0]) {
  test(`ordinary replicas ${replicas} survive a PD round trip`, async () => {
    const form = await renderForm();
    try {
      await act(async () =>
        form.ref.current.form.setFieldValue('replicas', replicas)
      );
      await form.toggle();
      assert.equal(form.values().replicas, 1);
      await form.toggle();
      assert.equal(form.values().replicas, replicas);
      const payload = await form.submit();
      assert.equal(payload.replicas, replicas);
    } finally {
      await form.unmount();
    }
  });
}

for (const replicas of [7, 0]) {
  test(`catalog replicas ${replicas} selected while PD is on are restored after disabling PD`, async () => {
    const form = await renderForm(false, true);
    try {
      await form.applyCatalogSpec(catalogSpec('A'));
      await form.toggle();
      await form.applyCatalogSpec({ ...catalogSpec('B'), replicas });
      assert.equal(form.values().replicas, 1);
      await form.toggle();
      assert.equal(form.values().replicas, replicas);
      const payload = await form.submit();
      assert.equal(payload.replicas, replicas);
    } finally {
      await form.unmount();
    }
  });
}

test('catalog scheduled scaling restores its baseline after PD instead of its live replica count', async () => {
  const form = await renderForm(false, true);
  try {
    await form.applyCatalogSpec(catalogSpec('A'));
    await form.toggle();
    await form.applyCatalogSpec({
      ...catalogSpec('B'),
      replicas: 9,
      scaling_schedule: { enabled: true, baseline_replicas: 3, rules: [] }
    });
    assert.equal(form.values().replicas, 1);
    await form.toggle();
    assert.equal(form.values().replicas, 3);
    const payload = await form.submit();
    assert.equal(payload.replicas, 3);
    assert.equal(payload.scaling_schedule.baseline_replicas, 3);
  } finally {
    await form.unmount();
  }
});

for (const backend of ['SGLang', 'llama-box']) {
  test(`ordinary zero replicas survive changing backend to ${backend} while PD is on`, async (context) => {
    const form = await renderForm();
    try {
      await act(async () => form.ref.current.form.setFieldValue('replicas', 0));
      await form.toggle();
      context.mock.timers.enable({ apis: ['setTimeout'] });
      let pending!: Promise<void>;
      await act(async () => {
        form.ref.current.form.setFieldValue('backend', backend);
        pending = formContext.onBackendChange(backend, { isBuiltIn: true });
      });
      await act(async () => context.mock.timers.tick(100));
      await act(async () => pending);
      if (backend === 'SGLang') {
        assert.equal(form.switchChecked(), 'true');
        assert.equal(form.values().replicas, 1);
        await form.toggle();
      }
      assert.equal(form.values().replicas, 0);
      assert.equal(form.values().roles, null);
      const payload = await form.submit();
      assert.equal(payload.backend, backend);
      assert.equal(payload.replicas, 0);
    } finally {
      await form.unmount();
      context.mock.timers.reset();
    }
  });
}
