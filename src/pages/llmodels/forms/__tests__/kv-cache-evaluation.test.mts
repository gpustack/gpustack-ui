import { atom } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, forwardRef, Fragment, createElement as h } from 'react';
import type {
  EvaluateResult,
  EvaluateSpec,
  FormData
} from '../../config/types';

const empty = () => null;
const ScrollSpyTabs = forwardRef(({ children }: any, _ref) => children);
const modes = [{ name: 'vllm-nixl', backends: ['vLLM'], display_name: 'NIXL' }];
const services = [11, 12].map((value) => ({
  label: `Cache ${value}`,
  value,
  state: 'running',
  provider_name: 'lmcache',
  disabled: false
}));
const skipEnv = { GPUSTACK_SKIP_MODEL_EVALUATION: '1' };
const evaluateModel = async (
  spec: EvaluateSpec
): Promise<{ results: Partial<EvaluateResult>[] }> => ({
  results: spec.env?.GPUSTACK_SKIP_MODEL_EVALUATION
    ? [
        {
          compatible: true,
          cluster_id: 1,
          resource_claim_by_cluster_id: { 1: { ram: 1024, vram: 2048 } },
          ...(spec.roles?.length && {
            role_resource_claims_by_cluster_id: {
              1: [{ role: 'prefill', replicas: 1, vram: 2048 }]
            }
          })
        }
      ]
    : []
});
let evaluate = evaluateModel;
const request = mock.fn(async (url: string, options: any) => {
  if (url === '/model-evaluations') {
    return evaluate(options.data.model_specs[0]);
  }
  if (url === '/pd-modes') return { items: modes };
  if (url === '/pd-modes/resolve') {
    return {
      mode: 'vllm-nixl',
      vendor: 'NVIDIA',
      candidate_vendors: ['NVIDIA'],
      cluster_vendors: ['NVIDIA'],
      options: []
    };
  }
  if (url === '/models/spanning-roles') return null;
  throw new Error(`Unexpected request ${url}`);
});

mock.module('@umijs/max', {
  namedExports: {
    request,
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertBlockInfo: empty,
    CheckboxField: ({ checked, disabled, onChange }: any) =>
      h(Checkbox, { checked, disabled, onChange }),
    CollapsePanel: ({ items }: any) =>
      items.map(({ key, children }: any) => h(Fragment, { key }, children)),
    IconFont: empty,
    InputNumber: ({ label, description: _description, ...props }: any) =>
      h(InputNumber, { ...props, 'aria-label': label }),
    LabelInfo: empty,
    ScrollSpyTabs,
    Select: ({ value, options, label, onChange }: any) =>
      h(
        'select',
        {
          'aria-label': label,
          value: value ?? '',
          onChange: (event: any) =>
            onChange(
              options.find(
                (option: any) => String(option.value) === event.target.value
              )?.value
            )
        },
        h('option', { value: '' }),
        options?.map((option: any) =>
          h('option', { value: option.value, key: option.value }, option.label)
        )
      ),
    createAxiosToken: () => ({ cancel() {}, token: {} }),
    useAppUtils: () => ({ getRuleMessage: (_: string, id: string) => id }),
    useQueryData: () => ({
      fetchData: async () => ({
        items: services.map(({ label, value, state, provider_name }) => ({
          name: label,
          id: value,
          state,
          provider_name
        }))
      })
    }),
    useWrapperContext: () => ({ getScrollElementScrollableHeight: () => 800 })
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
  namedExports: { clusterListAtom: atom([]), workerListAtom: atom([{ id: 1 }]) }
});
mock.module(new URL('../../../resources/apis/index.ts', import.meta.url).href, {
  namedExports: { queryModelFilesList: async () => ({ items: [] }) }
});
mock.module(
  new URL('../../../cluster-management/config/index.ts', import.meta.url).href,
  {
    namedExports: { ProviderValueMap: { Docker: 'Docker' } }
  }
);
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
  {
    namedExports: { useQueryContextLength: () => ({}) }
  }
);
mock.module(
  new URL('../../../kv-cache/services/provider-catalog.ts', import.meta.url)
    .href,
  {
    namedExports: {
      loadProviders: async () => [
        {
          name: 'lmcache',
          inference_backend_integrations: [{ backend: 'vLLM' }]
        }
      ]
    }
  }
);
for (const path of [
  '../advance-config.tsx',
  '../schedule-type.tsx',
  '../scheduled-scaling.tsx',
  '../speculative-decode.tsx',
  '../gather-locality.tsx',
  '../roles/router-form.tsx'
]) {
  mock.module(new URL(path, import.meta.url).href, { defaultExport: empty });
}

const dom = new JSDOM('<div id="root"></div>', { pretendToBeVisual: true });
for (const name of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'SVGElement',
  'Node',
  'MutationObserver',
  'ShadowRoot',
  'getComputedStyle'
] as const) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: name === 'window' ? dom.window : dom.window[name]
  });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true });
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

const { Checkbox, Form, Input, InputNumber } = await import('antd');
const { createRoot } = await import('react-dom/client');
const { RoleEnvironmentMode } = await import('../roles/role-environment.tsx');
const { default: RoleKVCache } = await import('../roles/role-kv-cache.tsx');
const { createDefaultRoles } = await import('../roles/transform.ts');
mock.module(new URL('../roles/role-form.tsx', import.meta.url).href, {
  defaultExport: (props: any) =>
    h(
      Fragment,
      null,
      h(RoleKVCache, props),
      h(RoleEnvironmentMode, { index: props.index })
    )
});
mock.module(new URL('../basic.tsx', import.meta.url).href, {
  defaultExport: () =>
    [
      'backend',
      'cluster_id',
      'env',
      'local_path',
      'replicas',
      'name',
      'source'
    ].map((name) => h(Form.Item, { key: name, name, hidden: true }, h(Input)))
});

const { default: DataForm } = await import('../index.tsx');
const { useCheckCompatibility } = await import('../../hooks/index.ts');
const source = 'local_path';
const Harness = ({
  formRef,
  initialValues
}: {
  formRef: React.Ref<any>;
  initialValues?: Partial<FormData>;
}) => {
  const { handleOnValuesChange, warningStatus } = useCheckCompatibility();
  return h(
    Fragment,
    null,
    h(DataForm, {
      ref: formRef,
      initialValues: {
        backend: 'vLLM',
        cluster_id: 1,
        local_path: '/models/test-model',
        replicas: 1,
        source,
        name: 'test-model',
        extended_kv_cache: { enabled: false },
        ...initialValues
      },
      source,
      action: 'create',
      formKey: 'deployment',
      isGGUF: false,
      clusterList: [],
      onOk: empty,
      onValuesChange: (changedValues, allValues) =>
        handleOnValuesChange({ changedValues, allValues, source })
    }),
    h(
      'output',
      { 'data-type': warningStatus.type },
      warningStatus.show && warningStatus.message
    )
  );
};

const document = dom.window.document;
const settle = () =>
  act(async () => new Promise((resolve) => setTimeout(resolve, 130)));
const find = <T extends HTMLElement>(selector: string) => {
  const element = document.querySelector<T>(selector);
  assert.ok(element, `Missing ${selector}`);
  return element;
};
const requests = () =>
  request.mock.calls.filter(
    ({ arguments: [url] }) => url === '/model-evaluations'
  );

test('switching the PD role environment mode refreshes the compatibility warning', async () => {
  const root = createRoot(find('#root'));
  const formRef = { current: null as any };
  const env = { VLLM_KV_CACHE_LAYOUT: 'NHD' };
  const decodeEnv = { VLLM_KV_CACHE_LAYOUT: 'HND' };
  const roles = createDefaultRoles().map((role) =>
    role.name === 'decode' ? { ...role, env: decodeEnv } : role
  );
  const conflict = 'Prefill and Decode KV cache layouts are incompatible';
  const preview = async (spec: EvaluateSpec) => {
    const compatible = spec.roles?.[0]?.env_mode === 'replace';
    return {
      results: [
        compatible
          ? {
              compatible,
              resource_claim_by_cluster_id: { 1: { ram: 0, vram: 2048 } }
            }
          : { compatible, compatibility_messages: [conflict] }
      ]
    };
  };
  const settleWarning = () =>
    act(async () => new Promise((resolve) => setTimeout(resolve, 350)));
  const switchMode = async (mode: 'merge' | 'replace') => {
    request.mock.resetCalls();
    const option = Array.from(
      find(
        '[aria-label="models.form.roles.env.mode"]'
      ).querySelectorAll<HTMLInputElement>('input[type="radio"]')
    ).find(
      (input) =>
        input.closest('label')?.textContent === `models.form.roles.env.${mode}`
    );
    assert.ok(option, `Missing ${mode} environment mode`);
    await act(async () => option.click());
    assert.equal(requests().length, 1);
    const [spec]: EvaluateSpec[] = requests()[0].arguments[1].data.model_specs;
    assert.deepEqual(spec.env, env);
    assert.equal(spec.disaggregation?.mode, 'vllm-nixl');
    assert.equal(spec.roles?.[0].env_mode, mode);
    assert.deepEqual(spec.roles?.[0].env, mode === 'replace' ? {} : null);
    assert.deepEqual(spec.roles?.[1].env, decodeEnv);
  };

  try {
    evaluate = preview;
    await act(async () =>
      root.render(
        h(Harness, {
          formRef,
          initialValues: { env, roles, disaggregation: { mode: 'vllm-nixl' } }
        })
      )
    );
    await act(async () => find('.section-title [role="switch"]').click());
    await settle();
    await settleWarning();
    assert.equal(find('output').textContent, conflict);

    await switchMode('replace');
    await settleWarning();
    assert.equal(requests().length, 1);
    assert.equal(find('output').getAttribute('data-type'), 'success');
    assert.match(
      find('output').textContent ?? '',
      /models\.form\.check\.claims/
    );

    await switchMode('merge');
    await settleWarning();
    assert.equal(requests().length, 1);
    assert.equal(find('output').textContent, conflict);

    let releasePrevious!: () => void;
    evaluate = async (spec) => {
      if (spec.roles?.[0].env_mode === 'replace') {
        await new Promise<void>((resolve) => (releasePrevious = resolve));
      }
      return preview(spec);
    };
    await switchMode('replace');
    await switchMode('merge');
    await settleWarning();
    assert.equal(find('output').textContent, conflict);
    await act(async () => releasePrevious());
    await settleWarning();
    assert.equal(find('output').textContent, conflict);
  } finally {
    evaluate = evaluateModel;
    await act(async () => root.unmount());
  }
});

test('an earlier result cannot replace the status of a later evaluation', async () => {
  const root = createRoot(find('#root'));
  let evaluateForm!: ReturnType<
    typeof useCheckCompatibility
  >['handleDoEvalute'];
  const Status = () => {
    const { handleDoEvalute, warningStatus } = useCheckCompatibility();
    evaluateForm = handleDoEvalute;
    return h(
      'output',
      { 'data-type': warningStatus.type },
      warningStatus.message
    );
  };
  const spec = { cluster_id: 1, source, local_path: '/models/test-model' };
  try {
    await act(async () => root.render(h(Status)));
    await act(async () => evaluateForm({ ...spec, env: skipEnv } as any));
    let release!: (result: Awaited<ReturnType<typeof evaluateModel>>) => void;
    evaluate = () => new Promise((resolve) => (release = resolve));
    let pending!: ReturnType<typeof evaluateForm>;
    await act(async () => {
      pending = evaluateForm(spec as any);
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 350)));
    assert.equal(find('output').getAttribute('data-type'), 'transition');
    await act(async () => {
      release({ results: [] });
      await pending;
    });
  } finally {
    evaluate = evaluateModel;
    await act(async () => root.unmount());
  }
});

test('the evaluation env flag leaves zero replicas unevaluated', async () => {
  const root = createRoot(find('#root'));
  let changeForm!: ReturnType<
    typeof useCheckCompatibility
  >['handleOnValuesChange'];
  const Status = () => {
    const { handleOnValuesChange, warningStatus } = useCheckCompatibility();
    changeForm = handleOnValuesChange;
    return h(
      'output',
      { 'data-type': warningStatus.type },
      warningStatus.message
    );
  };
  const spec = {
    cluster_id: 1,
    source,
    local_path: '/models/test-model'
  };
  const legacyEnv = { GPUSTACK_SKIP_MODEL_EVALUATION: '0' };
  const changeReplicas = async (replicas: number) => {
    await act(async () =>
      changeForm({
        changedValues: { replicas },
        allValues: { ...spec, replicas, env: legacyEnv },
        source
      })
    );
  };
  try {
    await act(async () => root.render(h(Status)));
    request.mock.resetCalls();
    await changeReplicas(1);
    assert.equal(requests().length, 1);
    await changeReplicas(0);
    assert.equal(requests().length, 1);
    await act(async () => new Promise((resolve) => setTimeout(resolve, 330)));
    assert.equal(find('output').textContent, '');

    await changeReplicas(1);
    assert.equal(requests().length, 2);
  } finally {
    await act(async () => root.unmount());
  }
});

for (const pd of [false, true]) {
  test(`${pd ? 'PD' : 'ordinary'} model evaluation shows resource claims with the env flag`, async () => {
    const root = createRoot(find('#root'));
    const formRef = { current: null as any };
    try {
      await act(async () => root.render(h(Harness, { formRef })));
      if (pd) {
        await act(async () => find('[role="switch"]').click());
        await settle();
      }
      request.mock.resetCalls();
      await act(async () => {
        formRef.current.form.setFieldValue('env', skipEnv);
        find(
          pd ? '.section-title [role="switch"]' : 'input[type="checkbox"]'
        ).click();
      });
      await act(async () => new Promise((resolve) => setTimeout(resolve, 450)));
      const [call] = requests();
      const [spec]: EvaluateSpec[] = call.arguments[1].data.model_specs;
      assert.deepEqual(spec.env, skipEnv);
      assert.equal(!!spec.roles?.length, pd);
      assert.equal(find('output').getAttribute('data-type'), 'success');
      assert.match(
        find('output').textContent ?? '',
        pd
          ? /models\.form\.check\.claims\.group/
          : /models\.form\.check\.claims/
      );
    } finally {
      await act(async () => root.unmount());
    }
  });

  test(`${pd ? 'PD' : 'ordinary'} KV cache evaluates once per committed change`, async () => {
    const root = createRoot(find('#root'));
    const formRef = { current: null as any };
    try {
      await act(async () => root.render(h(Harness, { formRef })));
      await settle();
      if (pd) {
        await act(async () => find('[role="switch"]').click());
        await settle();
        const form = formRef.current.form;
        await act(async () => {
          const injected = '--port={{ports.kv_port}}';
          form.setFieldValue(
            ['roles', 0, 'backend_parameters'],
            [injected, '--user-option']
          );
          form.setFieldValue(['roles', 0, '__injected'], {
            params: [injected]
          });
        });
      }
      const toggle = () =>
        find(
          pd ? '.section-title [role="switch"]' : 'input[type="checkbox"]'
        ).click();
      const service = (value: string) => {
        const select = find<HTMLSelectElement>(
          'select[aria-label="models.form.kvCache.backend"]'
        );
        select.value = value;
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      };
      const ram = () =>
        find<HTMLInputElement>('input[aria-label="models.form.ramSize"]');
      const typeNumber = (input: HTMLInputElement, value: string) => {
        input.focus();
        Object.getOwnPropertyDescriptor(
          dom.window.HTMLInputElement.prototype,
          'value'
        )!.set!.call(input, value);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      };
      const typeRam = (value: string) => typeNumber(ram(), value);
      const stepRam = (label: string) => {
        const button = ram()
          .closest('.ant-input-number')
          ?.querySelector(`[aria-label="${label}"]`);
        assert.ok(button);
        for (const event of ['mousedown', 'mouseup']) {
          button.dispatchEvent(
            new dom.window.MouseEvent(event, { bubbles: true })
          );
        }
      };
      const change = async (interact: () => void) => {
        request.mock.resetCalls();
        await act(async () => {
          interact();
          assert.equal(
            requests().length,
            0,
            'automatic form notification must be filtered'
          );
        });
        await settle();
        const [call] = requests();
        assert.equal(
          requests().length,
          1,
          'one evaluation after the cache write'
        );
        const { method, data } = call.arguments[1];
        assert.equal(method, 'POST');
        assert.equal(data.cluster_id, 1);
        const [spec]: EvaluateSpec[] = data.model_specs;
        if (pd) {
          assert.equal(spec.disaggregation?.mode, 'vllm-nixl');
          const prefill = spec.roles?.find(({ name }) => name === 'prefill');
          assert.ok(prefill);
          assert.deepEqual(prefill.backend_parameters, ['--user-option']);
          assert.equal(spec.extended_kv_cache?.enabled ?? false, false);
          return prefill.extended_kv_cache;
        }
        assert.equal(spec.roles, null);
        return spec.extended_kv_cache;
      };

      const enabled = await change(toggle);
      assert.equal(enabled?.enabled, true);
      assert.equal(enabled?.mode, 'local');
      assert.equal(enabled?.ram_ratio, 1.2);

      request.mock.resetCalls();
      await act(async () =>
        typeNumber(
          find<HTMLInputElement>('input[aria-label="models.form.chunkSize"]'),
          '512'
        )
      );
      await settle();
      assert.equal(
        requests().length,
        0,
        'chunk size must not trigger evaluation'
      );

      const resized = await change(() => typeRam('12.6'));
      assert.equal(resized?.ram_size, 13);
      assert.equal(resized?.chunk_size, 512);
      assert.equal((await change(() => typeRam('')))?.ram_size, null);
      assert.equal(
        (await change(() => stepRam('Increase Value')))?.ram_size,
        1
      );
      assert.equal(
        (await change(() => stepRam('Decrease Value')))?.ram_size,
        0
      );

      for (const id of [11, 12]) {
        const shared = await change(() => service(String(id)));
        assert.equal(shared?.mode, 'shared');
        assert.equal(shared?.cache_service_id, id);
        assert.equal(shared?.ram_size ?? null, null);
      }

      const local = await change(() => service('in-process'));
      assert.equal(local?.mode, 'local');
      assert.equal(local?.cache_service_id ?? null, null);
      assert.equal(local?.ram_size, 0);
      assert.equal((await change(toggle))?.enabled, false);
    } finally {
      await act(async () => root.unmount());
    }
  });
}
