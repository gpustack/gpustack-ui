import { atom } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, Fragment, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import type { PDModeResolution } from '../../config/types';

const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const empty = () => null;
const ScrollSpyTabs = forwardRef((props: any, _ref) => passChildren(props));
const InputField = ({ value }: any) =>
  createElement('span', null, String(value ?? ''));
const modes = [
  {
    name: 'vllm-nixl',
    backends: ['vLLM'],
    gpu_filters: { vendor: ['nvidia'] },
    display_name: 'vLLM + NIXL',
    cache_services: [
      { provider: 'LMCache', roles: { prefill: {}, decode: {} } }
    ],
    roles: {
      prefill: {
        connector: { kv_connector: 'NixlConnector', kv_role: 'kv_both' },
        env: { NIXL_ROLE: 'prefill' }
      },
      decode: {
        args: ['--nixl-argument', 'decode'],
        env: { NIXL_ROLE: 'decode' }
      }
    },
    router: {
      connection_args: ['--host', '{{worker_ip}}'],
      tunable_args: [{ flag: '--policy', default: 'round_robin' }]
    }
  },
  {
    name: 'vllm-alternate',
    backends: ['vLLM'],
    gpu_filters: { vendor: ['ascend'] },
    display_name: 'vLLM + Alternate',
    roles: {
      prefill: {
        args: ['--alternate', 'prefill'],
        env: { ALTERNATE_ROLE: 'prefill' }
      }
    },
    router: { connection_args: ['--alternate-host', '{{worker_ip}}'] }
  },
  {
    name: 'vllm-mooncake',
    backends: ['vLLM'],
    gpu_filters: { vendor: ['nvidia'] },
    display_name: 'vLLM + Mooncake',
    cache_services: [
      { provider: 'Mooncake', roles: { prefill: {}, decode: {} } }
    ]
  },
  {
    name: 'sglang-mooncake',
    backends: ['SGLang'],
    gpu_filters: { vendor: ['nvidia'] },
    display_name: 'SGLang + Mooncake'
  },
  { name: 'custom', backends: [], display_name: 'Custom' }
];
const defaultResolution = async ({
  backend,
  cluster_id,
  vendor
}: any): Promise<PDModeResolution> => {
  const recommendedMode =
    backend === 'SGLang'
      ? 'sglang-mooncake'
      : cluster_id === 2 || vendor === 'Ascend'
        ? 'vllm-alternate'
        : 'vllm-nixl';
  return {
    mode: recommendedMode,
    vendor: vendor ?? 'NVIDIA',
    candidate_vendors: ['NVIDIA', 'Ascend'],
    cluster_vendors: ['NVIDIA'],
    options: modes.map((mode) => {
      const eligible = !mode.backends.length || mode.backends.includes(backend);
      return {
        name: mode.name,
        eligible,
        recommended: mode.name === recommendedMode,
        ...(eligible
          ? {}
          : {
              ineligible_code: 'backend_mismatch',
              ineligible_reason: `Requires ${mode.backends.join(' / ')} (current: ${backend}).`,
              ineligible_params: { backend, targets: mode.backends.join(' / ') }
            })
      };
    })
  };
};
const partitionWarning = 'Choose an accelerator partition.';
const partitionResolution = ({
  backend = 'vLLM',
  vendor,
  vendors = ['nvidia', 'ascend']
}: {
  backend?: string;
  vendor?: string;
  vendors?: string[];
} = {}): PDModeResolution => {
  const candidates = vendor
    ? [vendor]
    : vendors.filter((item) => backend === 'vLLM' || item === 'nvidia');
  const resolvedVendor = candidates.length === 1 ? candidates[0] : undefined;
  const recommendedMode = !resolvedVendor
    ? null
    : backend === 'SGLang'
      ? 'sglang-mooncake'
      : resolvedVendor === 'ascend'
        ? 'vllm-alternate'
        : 'vllm-nixl';
  return {
    mode: recommendedMode,
    vendor: resolvedVendor,
    candidate_vendors: candidates,
    cluster_vendors: vendors,
    unresolved_reason: !resolvedVendor ? partitionWarning : undefined,
    options: modes.map((mode) => {
      const backendOk =
        !mode.backends.length || mode.backends.includes(backend);
      const vendorOk =
        !mode.gpu_filters?.vendor.length ||
        mode.gpu_filters.vendor.some((item) =>
          (resolvedVendor ? [resolvedVendor] : vendors).includes(item)
        );
      return {
        name: mode.name,
        eligible: backendOk && vendorOk,
        recommended: mode.name === recommendedMode,
        ineligible_reason: !backendOk
          ? `Requires ${mode.backends.join(' / ')}.`
          : !vendorOk
            ? `Requires ${mode.gpu_filters!.vendor.join(' / ')} accelerators; chosen partition has ${resolvedVendor}.`
            : undefined
      };
    })
  };
};
const deferredResolution = () => {
  let resolve!: (value: PDModeResolution) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<PDModeResolution>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
};
const workerListAtom = atom<any[]>([]);
// tsx loads source modules through CommonJS, which owns a separate Jotai
// default store from the test runner's ESM import.
const { getDefaultStore } = createRequire(import.meta.url)('jotai');
const mixedWorkers = [{ cluster_id: 1, vendors: ['nvidia', 'ascend'] }];
const transportSelect = () =>
  dom.window.document.querySelector<HTMLSelectElement>(
    'select[aria-label="models.form.pd.mode"]'
  )!;
const vendorSelect = () =>
  dom.window.document.querySelector<HTMLSelectElement>(
    'select[aria-label="models.form.pd.vendor"]'
  );
let resolveMode = defaultResolution;
const resolutionRequests = mock.fn((params: any) => resolveMode(params));
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertBlockInfo: empty,
    CollapsePanel: ({ items }: any) =>
      items.map((item: any) =>
        createElement(Fragment, { key: item.key }, item.children)
      ),
    ScrollSpyTabs,
    IconFont: empty,
    AutoTooltip: passChildren,
    InputNumber: InputField,
    LabelSelector: InputField,
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
            {
              key: option.value,
              value: option.value,
              disabled: option.disabled
            },
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
  namedExports: { workerListAtom }
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
        isBuiltIn: true,
        versions: [{ value: '0.29.0', label: '0.29.0' }]
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
  new URL('../../services/use-query-cache-services.ts', import.meta.url).href,
  {
    namedExports: {
      knownCacheService: (_clusterId: number, serviceId: number) =>
        serviceId === 14 ? { provider_name: 'Mooncake' } : undefined
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
const { createDefaultRoles } = await import('../roles/transform.ts');
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
// Keep the real PD body, role tabs, override sections and injection effects.
// Only the unrelated leaf editors are replaced with their registered fields.
mock.module(new URL('../backend-parameters-list.tsx', import.meta.url).href, {
  defaultExport: ({ namePrefix }: any) =>
    createElement(
      Form.Item,
      { name: [...namePrefix, 'backend_parameters'] },
      createElement(InputField)
    )
});
for (const path of [
  '../advance-config.tsx',
  '../performance.tsx',
  '../schedule-type.tsx',
  '../scheduled-scaling.tsx',
  '../gather-locality.tsx',
  '../speculative-decode.tsx',
  '../roles/role-kv-cache.tsx'
]) {
  mock.module(new URL(path, import.meta.url).href, { defaultExport: empty });
}
mock.module(new URL('../roles/router-scheduling.tsx', import.meta.url).href, {
  defaultExport: Object.assign(empty, { RouterResources: empty })
});
const { default: DataForm } = await import('../index.tsx');

const clone = (value: any) => JSON.parse(JSON.stringify(value));
const savedRoles = () =>
  createDefaultRoles().map((role: any) => ({
    ...role,
    backend_parameters: [`--custom-${role.name} kept`],
    env: { USER_VARIABLE: role.name },
    overrides: { ...role.overrides, parameters: true }
  }));

const renderForm = async ({
  mode,
  vendor,
  action = 'edit',
  pd = true,
  roles = savedRoles(),
  workers = []
}: {
  mode?: string;
  vendor?: string;
  action?: string;
  pd?: boolean;
  roles?: any[];
  workers?: any[];
} = {}) => {
  getDefaultStore().set(workerListAtom, workers);
  const root = createRoot(dom.window.document.getElementById('root')!);
  const ref: any = { current: null };
  const submitted = mock.fn(clone);
  const initialValues: any = {
    backend: 'vLLM',
    backend_version: '0.29.0',
    cluster_id: 1,
    replicas: 1,
    source: 'local_path',
    name: 'model',
    ...(pd
      ? {
          roles,
          disaggregation: mode ? { mode, vendor } : undefined
        }
      : {})
  };
  await act(async () =>
    root.render(
      createElement(DataForm, {
        ref,
        initialValues,
        source: 'local_path',
        action,
        formKey: 'deployment',
        isGGUF: false,
        clusterList: [],
        onOk: submitted,
        onBackendChange() {}
      })
    )
  );
  const change = async (label: string, value: string) => {
    const select = dom.window.document.querySelector(
      `select[aria-label="${label}"]`
    ) as HTMLSelectElement;
    assert.ok(select, `missing ${label} selector`);
    await act(async () => {
      select.value = value;
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
  };
  const submit = async () => {
    await act(async () => {
      await ref.current.form.validateFields();
      ref.current.submit();
    });
    return submitted.mock.calls.at(-1)?.result;
  };
  const changeBackend = async (backend: string) => {
    let pending: any;
    await act(async () => {
      ref.current.form.setFieldValue('backend', backend);
      pending = context.onBackendChange(backend, { isBuiltIn: true });
    });
    await act(async () => pending);
  };
  const changeCluster = async (clusterId: number) => {
    await act(async () =>
      ref.current.form.setFieldValue('cluster_id', clusterId)
    );
  };
  const enablePD = async () => {
    await act(async () =>
      (
        dom.window.document.querySelector('[role="switch"]') as HTMLElement
      ).click()
    );
    await act(async () => new Promise((resolve) => setTimeout(resolve, 110)));
  };
  return {
    root,
    ref,
    initialValues,
    change,
    submit,
    changeBackend,
    changeCluster,
    enablePD
  };
};

for (const action of ['edit', 'create']) {
  test(`opening a saved Custom PD configuration preserves all roles and submit (${action === 'create' ? 'copy' : action})`, async () => {
    const { root, ref, initialValues, submit } = await renderForm({
      mode: 'custom',
      action
    });
    try {
      assert.equal(
        ref.current.form.getFieldValue(['disaggregation', 'mode']),
        'custom'
      );
      const roles = ref.current.form.getFieldValue('roles');
      for (const [index, role] of roles.entries()) {
        assert.deepEqual(
          role.backend_parameters,
          initialValues.roles[index].backend_parameters
        );
        assert.deepEqual(role.env, initialValues.roles[index].env);
        assert.equal(role.__injected, undefined);
      }
      const payload = await submit();
      assert.equal(payload.disaggregation.mode, 'custom');
      for (const [index, role] of payload.roles.entries()) {
        assert.deepEqual(
          role.backend_parameters,
          initialValues.roles[index].backend_parameters
        );
        assert.deepEqual(role.env, initialValues.roles[index].env);
        assert.equal(Object.hasOwn(role, '__injected'), false);
      }
    } finally {
      await act(async () => root.unmount());
    }
  });
}

test('opening a saved explicit built-in transport preserves it over the recommendation', async () => {
  const { root, ref, submit } = await renderForm({ mode: 'vllm-alternate' });
  try {
    assert.equal(
      ref.current.form.getFieldValue(['disaggregation', 'mode']),
      'vllm-alternate'
    );
    const roles = ref.current.form.getFieldValue('roles');
    assert.ok(roles[0].backend_parameters.includes('--alternate prefill'));
    assert.equal(roles[0].env.ALTERNATE_ROLE, 'prefill');
    assert.equal(roles[0].env.NIXL_ROLE, undefined);
    assert.ok(
      roles[2].backend_parameters.includes('--alternate-host {{worker_ip}}')
    );
    const payload = await submit();
    assert.equal(payload.disaggregation.mode, 'vllm-alternate');
    assert.deepEqual(payload.roles[0].backend_parameters, [
      '--custom-prefill kept'
    ]);
    assert.deepEqual(payload.roles[0].env, { USER_VARIABLE: 'prefill' });
  } finally {
    await act(async () => root.unmount());
  }
});

for (const action of ['edit', 'create']) {
  test(`opening a saved Mooncake deployment preserves both role caches and submit (${action === 'create' ? 'copy' : action})`, async () => {
    const roles = savedRoles().map((role: any) => ({
      ...role,
      extended_kv_cache:
        role.name === 'router'
          ? null
          : { enabled: true, mode: 'shared', cache_service_id: 14 }
    }));
    const { root, ref, submit } = await renderForm({
      mode: 'vllm-mooncake',
      roles,
      action
    });
    try {
      assert.equal(
        ref.current.form.getFieldValue(['disaggregation', 'mode']),
        'vllm-mooncake'
      );
      assert.equal(
        dom.window.document.querySelector<HTMLSelectElement>(
          'select[aria-label="models.form.pd.mode"]'
        )?.selectedOptions[0].textContent,
        'Mooncake'
      );
      const payload = await submit();
      assert.equal(payload.disaggregation.mode, 'vllm-mooncake');
      for (const index of [0, 1]) {
        assert.deepEqual(
          ref.current.form.getFieldValue(['roles', index, 'extended_kv_cache']),
          roles[index].extended_kv_cache
        );
        assert.deepEqual(
          payload.roles[index].extended_kv_cache,
          roles[index].extended_kv_cache
        );
      }
    } finally {
      await act(async () => root.unmount());
    }
  });
}

test('enabling PD without a selected transport applies the recommendation and role injection', async () => {
  const { root, ref, enablePD } = await renderForm({
    action: 'create',
    pd: false
  });
  try {
    await enablePD();
    assert.equal(
      ref.current.form.getFieldValue(['disaggregation', 'mode']),
      'vllm-nixl'
    );
    const roles = ref.current.form.getFieldValue('roles');
    assert.ok(
      roles[0].backend_parameters.some((line: string) =>
        line.includes('NixlConnector')
      )
    );
    assert.equal(roles[0].env.NIXL_ROLE, 'prefill');
    assert.ok(roles[1].backend_parameters.includes('--nixl-argument decode'));
    assert.ok(roles[2].backend_parameters.includes('--host {{worker_ip}}'));
  } finally {
    await act(async () => root.unmount());
  }
});

for (const input of ['backend', 'cluster', 'vendor']) {
  test(`changing ${input} recomputes a saved Custom transport`, async () => {
    const { root, ref, change, changeBackend, changeCluster } =
      await renderForm({ mode: 'custom' });
    try {
      if (input === 'backend') await changeBackend('SGLang');
      if (input === 'cluster') await changeCluster(2);
      if (input === 'vendor') await change('models.form.pd.vendor', 'Ascend');
      assert.equal(
        ref.current.form.getFieldValue(['disaggregation', 'mode']),
        input === 'backend' ? 'sglang-mooncake' : 'vllm-alternate'
      );
      assert.ok(
        ref.current.form
          .getFieldValue(['roles', 0, 'backend_parameters'])
          .includes('--custom-prefill kept')
      );
    } finally {
      await act(async () => root.unmount());
    }
  });
}

for (const action of ['create', 'edit']) {
  test(`switching engines automatically selects an eligible transport without field errors (${action})`, async () => {
    const { root, ref, changeBackend, enablePD } = await renderForm({
      action,
      pd: action === 'edit',
      mode: 'vllm-nixl'
    });
    const modePath = ['disaggregation', 'mode'];
    try {
      if (action === 'create') await enablePD();
      assert.equal(ref.current.form.getFieldValue(modePath), 'vllm-nixl');
      assert.deepEqual(ref.current.form.getFieldError(modePath), []);
      for (const [backend, expectedMode] of [
        ['SGLang', 'sglang-mooncake'],
        ['vLLM', 'vllm-nixl']
      ]) {
        await changeBackend(backend);
        assert.equal(ref.current.form.getFieldValue(modePath), expectedMode);
        // A later validateFields/submit would clear the stale error and hide
        // the regression, so inspect the automatic validation result directly.
        assert.deepEqual(ref.current.form.getFieldError(modePath), []);
      }
    } finally {
      await act(async () => root.unmount());
    }
  });
}

test('a retained ineligible transport is rejected and its error clears when eligibility recovers', async () => {
  const { root, ref, changeCluster } = await renderForm({ mode: 'vllm-nixl' });
  const modePath = ['disaggregation', 'mode'];
  const reason = 'This transport is unavailable on the selected accelerator.';
  resolveMode = async (params: any) => {
    const resolution = await defaultResolution(params);
    return params.cluster_id === 2
      ? {
          ...resolution,
          mode: null,
          options: resolution.options.map((option) =>
            option.name === 'vllm-nixl'
              ? {
                  ...option,
                  eligible: false,
                  ineligible_code: 'vendor_mismatch',
                  ineligible_reason: reason
                }
              : option
          )
        }
      : resolution;
  };
  try {
    await changeCluster(2);
    assert.equal(ref.current.form.getFieldValue(modePath), 'vllm-nixl');
    assert.deepEqual(ref.current.form.getFieldError(modePath), [reason]);
    await act(async () => {
      await assert.rejects(
        ref.current.form.validateFields([modePath]),
        (error: any) => {
          assert.deepEqual(error.errorFields[0].errors, [reason]);
          return true;
        }
      );
    });
    await changeCluster(1);
    assert.equal(ref.current.form.getFieldValue(modePath), 'vllm-nixl');
    assert.deepEqual(ref.current.form.getFieldError(modePath), []);
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

test('a late resolution for the previous engine cannot replace the current transport or eligibility', async () => {
  const { root, ref, changeBackend } = await renderForm({ mode: 'vllm-nixl' });
  const modePath = ['disaggregation', 'mode'];
  let finishResolution!: (value: any) => void;
  resolveMode = (params: any) =>
    params.backend === 'SGLang'
      ? new Promise((resolve) => {
          finishResolution = resolve;
        })
      : defaultResolution(params);
  try {
    await changeBackend('SGLang');
    assert.ok(finishResolution);
    await changeBackend('vLLM');
    assert.equal(ref.current.form.getFieldValue(modePath), 'vllm-nixl');
    assert.deepEqual(ref.current.form.getFieldError(modePath), []);
    await act(async () =>
      finishResolution(await defaultResolution({ backend: 'SGLang' }))
    );
    assert.equal(ref.current.form.getFieldValue(modePath), 'vllm-nixl');
    assert.deepEqual(ref.current.form.getFieldError(modePath), []);
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

test('a pending partition change disables transports for the other vendor and accepts the new recommendation', async () => {
  resolveMode = async (params: any) => partitionResolution(params);
  const { root, ref, change } = await renderForm({
    mode: 'vllm-nixl',
    workers: mixedWorkers
  });
  const pending = deferredResolution();
  resolveMode = () => pending.promise;
  const modePath = ['disaggregation', 'mode'];
  try {
    await change('models.form.pd.vendor', 'ascend');
    const oldTransport = Array.from(transportSelect().options).find(
      (option) => option.value === 'vllm-nixl'
    );
    assert.equal(oldTransport?.disabled, true);
    assert.deepEqual(ref.current.form.getFieldError(modePath), [
      'models.form.pd.mode.runtime.mismatch'
    ]);
    assert.ok(
      !Array.from(transportSelect().options).some(
        (option) => option.value === 'vllm-mooncake'
      )
    );
    assert.ok(
      !dom.window.document.body.textContent?.includes(partitionWarning)
    );
    await act(async () => {
      await assert.rejects(ref.current.form.validateFields([modePath]));
    });
    await act(async () =>
      pending.resolve(partitionResolution({ vendor: 'ascend' }))
    );
    assert.equal(ref.current.form.getFieldValue(modePath), 'vllm-alternate');
    assert.deepEqual(ref.current.form.getFieldError(modePath), []);
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

test('an automatically selected vendor keeps the fresh authoritative eligibility verdicts', async () => {
  resolveMode = async (params: any) => {
    const resolution = partitionResolution({ ...params, vendors: ['nvidia'] });
    return {
      ...resolution,
      options: resolution.options.map((option) =>
        option.name === 'vllm-mooncake'
          ? {
              ...option,
              eligible: false,
              ineligible_reason:
                'This recipe is unavailable according to the server.'
            }
          : option
      )
    };
  };
  const { root, ref } = await renderForm({
    workers: [{ cluster_id: 1, vendors: ['nvidia'] }]
  });
  try {
    assert.equal(
      ref.current.form.getFieldValue(['disaggregation', 'vendor']),
      'nvidia'
    );
    assert.equal(
      ref.current.form.getFieldValue(['disaggregation', 'mode']),
      'vllm-nixl'
    );
    assert.ok(
      !Array.from(transportSelect().options).some(
        (option) => option.value === 'vllm-mooncake'
      ),
      'the unrequested vendor written by resolution must not invalidate its verdicts'
    );
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

test('a selected vendor absent from the new cluster cannot bypass its known accelerator inventory', async () => {
  resolveMode = async (params: any) => partitionResolution(params);
  const { root, changeCluster } = await renderForm({
    mode: 'vllm-nixl',
    vendor: 'nvidia',
    workers: [
      { cluster_id: 1, vendors: ['nvidia'] },
      { cluster_id: 2, vendors: ['ascend'] }
    ]
  });
  const pending = deferredResolution();
  resolveMode = () => pending.promise;
  try {
    await changeCluster(2);
    assert.equal(
      Array.from(transportSelect().options).find(
        (option) => option.value === 'vllm-nixl'
      )?.disabled,
      true
    );
    await act(async () =>
      pending.resolve({
        ...partitionResolution({ vendor: 'ascend', vendors: ['ascend'] }),
        mode: null,
        vendor: null,
        candidate_vendors: [],
        unresolved_reason: 'The selected vendor is not present in this cluster.'
      })
    );
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

test('choosing Custom while a partition resolves keeps the vendor picker usable and ignores the late answer', async () => {
  resolveMode = async (params: any) => partitionResolution(params);
  const { root, ref, change } = await renderForm({
    mode: 'vllm-nixl',
    workers: mixedWorkers
  });
  const pending = deferredResolution();
  resolveMode = () => pending.promise;
  const modePath = ['disaggregation', 'mode'];
  try {
    await change('models.form.pd.vendor', 'ascend');
    assert.ok(vendorSelect());
    await change('models.form.pd.mode', 'custom');
    await act(async () =>
      pending.resolve(partitionResolution({ vendor: 'ascend' }))
    );
    assert.equal(ref.current.form.getFieldValue(modePath), 'custom');
    assert.deepEqual(ref.current.form.getFieldError(modePath), []);
    assert.ok(
      vendorSelect(),
      'canceling a resolve must not trap the chosen partition'
    );
    resolveMode = async (params: any) => partitionResolution(params);
    await change('models.form.pd.vendor', 'nvidia');
    assert.equal(ref.current.form.getFieldValue(modePath), 'vllm-nixl');
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

for (const outcome of ['unresolved', 'failure']) {
  test(`a vendor resolution ${outcome} revalidates the retained transport for the selected partition`, async () => {
    resolveMode = async (params: any) => partitionResolution(params);
    const { root, ref, change } = await renderForm({
      mode: 'vllm-nixl',
      workers: mixedWorkers
    });
    const pending = deferredResolution();
    resolveMode = () => pending.promise;
    const modePath = ['disaggregation', 'mode'];
    try {
      await change('models.form.pd.vendor', 'ascend');
      await act(async () => {
        if (outcome === 'failure') {
          pending.reject(new Error('Resolver unavailable'));
        } else {
          const resolution = partitionResolution({ vendor: 'ascend' });
          pending.resolve({
            ...resolution,
            mode: null,
            unresolved_reason: 'No recipe is preferred for this partition.',
            options: resolution.options.map((option) => ({
              ...option,
              recommended: false
            }))
          });
        }
      });
      assert.equal(ref.current.form.getFieldValue(modePath), 'vllm-nixl');
      assert.ok(
        ref.current.form.getFieldError(modePath).length > 0,
        'automatic resolution completion must revalidate a retained incompatible mode'
      );
      if (outcome === 'unresolved') {
        assert.deepEqual(ref.current.form.getFieldError(modePath), [
          'Requires nvidia accelerators; chosen partition has ascend.'
        ]);
      }
    } finally {
      resolveMode = defaultResolution;
      await act(async () => root.unmount());
    }
  });
}

for (const input of ['backend', 'cluster']) {
  test(`changing ${input} hides the previous resolution warning and vendor choices while resolving`, async () => {
    resolveMode = async (params: any) => partitionResolution(params);
    const { root, changeBackend, changeCluster } = await renderForm({
      mode: 'custom',
      workers: mixedWorkers
    });
    const pending = deferredResolution();
    resolveMode = () => pending.promise;
    try {
      assert.ok(vendorSelect());
      assert.ok(
        dom.window.document.body.textContent?.includes(partitionWarning)
      );
      if (input === 'backend') await changeBackend('SGLang');
      else await changeCluster(2);
      assert.equal(vendorSelect(), null);
      assert.ok(
        !dom.window.document.body.textContent?.includes(partitionWarning)
      );
      await act(async () =>
        pending.resolve(
          partitionResolution({
            backend: input === 'backend' ? 'SGLang' : 'vLLM',
            vendors: ['nvidia']
          })
        )
      );
      assert.equal(vendorSelect(), null);
      assert.ok(
        !dom.window.document.body.textContent?.includes(partitionWarning)
      );
    } finally {
      resolveMode = defaultResolution;
      await act(async () => root.unmount());
    }
  });
}

test('a late recommendation cannot overwrite a transport explicitly picked while resolving', async () => {
  let finishResolution!: (value: any) => void;
  resolveMode = () =>
    new Promise((resolve) => {
      finishResolution = resolve;
    });
  const { root, ref, change } = await renderForm({ action: 'create' });
  try {
    assert.ok(finishResolution);
    await change('models.form.pd.mode', 'custom');
    await act(async () =>
      finishResolution(await defaultResolution({ backend: 'vLLM' }))
    );
    assert.equal(
      ref.current.form.getFieldValue(['disaggregation', 'mode']),
      'custom'
    );
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

test('a late resolution for the previous cluster cannot replace the current recommendation', async () => {
  const { root, ref, changeCluster } = await renderForm({ mode: 'custom' });
  let finishResolution!: (value: any) => void;
  resolveMode = ({ cluster_id, ...params }: any) =>
    cluster_id === 2
      ? new Promise((resolve) => {
          finishResolution = resolve;
        })
      : defaultResolution(params);
  try {
    await changeCluster(2);
    assert.ok(finishResolution);
    await changeCluster(3);
    assert.equal(
      ref.current.form.getFieldValue(['disaggregation', 'mode']),
      'vllm-nixl'
    );
    await act(async () =>
      finishResolution({
        mode: 'vllm-alternate',
        vendor: 'Ascend',
        candidate_vendors: [],
        cluster_vendors: [],
        options: []
      })
    );
    assert.equal(
      ref.current.form.getFieldValue(['disaggregation', 'mode']),
      'vllm-nixl'
    );
  } finally {
    resolveMode = defaultResolution;
    await act(async () => root.unmount());
  }
});

test('an unresolved recommendation retains a saved mode and vendor without selecting a mode for a new group', async () => {
  resolveMode = async () => ({
    mode: null,
    vendor: 'NVIDIA',
    candidate_vendors: ['NVIDIA', 'Ascend'],
    cluster_vendors: ['NVIDIA', 'Ascend'],
    options: []
  });
  try {
    for (const mode of ['custom', undefined]) {
      const { root, ref } = await renderForm({ mode, vendor: 'Ascend' });
      try {
        assert.equal(
          ref.current.form.getFieldValue(['disaggregation', 'mode']),
          mode
        );
        if (mode)
          assert.equal(
            ref.current.form.getFieldValue(['disaggregation', 'vendor']),
            'Ascend'
          );
      } finally {
        await act(async () => root.unmount());
      }
    }
  } finally {
    resolveMode = defaultResolution;
  }
});
