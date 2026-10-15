import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import {
  act,
  createElement,
  forwardRef,
  Fragment,
  useImperativeHandle
} from 'react';
import { createRoot } from 'react-dom/client';

const clone = (value: any) => JSON.parse(JSON.stringify(value));
const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
let store: any;
let childProps: any;
let specs: any[];
const evaluated = mock.fn(clone);

mock.module('@gpustack/core-ui', {
  namedExports: {
    ColumnWrapper: passChildren,
    GSDrawer: passChildren,
    ModalFooter: empty,
    createAxiosToken: () => ({ token: 'catalog-test', cancel() {} })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: { Button: passChildren, message: { error: empty } }
});
mock.module('styled-components', {
  defaultExport: { div: () => passChildren }
});
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: {} }
});
mock.module(
  new URL('../../../../cluster-management/config/index.ts', import.meta.url)
    .href,
  { namedExports: { ClusterStatusValueMap: { Ready: 'ready' } } }
);
mock.module(new URL('../../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryCatalogItemSpec: async () => ({ items: clone(specs) })
  }
});
mock.module(new URL('../../../hooks/index.ts', import.meta.url).href, {
  namedExports: {
    useCheckCompatibility: () => ({
      setWarningStatus: empty,
      handleDoEvalute: evaluated,
      cancelEvaluate: empty,
      clearCacheFormValues: empty,
      submitAnyway: { current: false },
      handleOnValuesChange: empty,
      warningStatus: { show: false }
    })
  }
});
mock.module(
  new URL('../../../hooks/use-form-initial-values.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      getClusterList: empty,
      getWorkerList: empty,
      clusterList: []
    })
  }
);
mock.module(new URL('../../compatible-alert.tsx', import.meta.url).href, {
  defaultExport: empty
});

// DataForm's spec transition is exercised in pd-toggle-state.test.mts. This
// facade supplies its committed values so the real wrapper must evaluate the
// completed action rather than the raw catalog response that preceded it.
const DataForm = forwardRef((props: any, ref) => {
  childProps = props;
  useImperativeHandle(ref, () => ({
    getFieldsValue: () => clone(store),
    getFieldValue: (name: string) => store[name],
    setFieldValue: (name: string, value: any) => {
      store[name] = value;
    },
    applyCatalogSpec: (values: any) => {
      const pdActive = !!store.roles?.length;
      Object.assign(store, clone(values));
      if (pdActive) {
        Object.assign(store, {
          replicas: 1,
          backend_parameters: [],
          env: {},
          worker_selector: {},
          gpu_selector: null,
          gpu_type_selector: null,
          placement_strategy: undefined,
          extended_kv_cache: { enabled: false },
          lora_list: []
        });
      }
    },
    applyRuntimeChoice: (runtime: any) => Object.assign(store, clone(runtime))
  }));
  return null;
});
mock.module(new URL('../../../forms/index.tsx', import.meta.url).href, {
  defaultExport: DataForm
});

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

const { default: DeployBuiltinModal } =
  await import('../deploy-builtin-modal.tsx');

const specB = {
  backend: 'vLLM',
  source: 'huggingface',
  huggingface_repo_id: 'org/model-B',
  mode: 'throughput',
  replicas: 7,
  backend_parameters: ['--max-model-len=4096'],
  env: { SPEC: 'B' },
  worker_selector: { pool: 'B' },
  gpu_selector: { gpu_ids: [['worker-B', 'B:gpu:0']], gpus_per_replica: 2 },
  extended_kv_cache: { enabled: true, cache_service_id: 92 },
  lora_list: [{ lora_name: 'adapter-B' }],
  image_name: 'model-B:latest',
  run_command: 'serve-B'
};

const fetchClusterSpec = async (
  pdActive: boolean,
  selectedSpec: any = specB,
  uiValues: any = {}
) => {
  store = {
    backend: 'vLLM',
    source: 'local_path',
    replicas: 1,
    scheduleType: 'manual',
    manualGpuMode: 'full_gpu',
    ...(pdActive ? { pdMode: 'disaggregated' } : {}),
    ...uiValues,
    roles: pdActive ? [{ name: 'prefill' }, { name: 'decode' }] : null,
    disaggregation: pdActive ? { mode: 'vllm-nixl' } : null
  };
  specs = [selectedSpec];
  evaluated.mock.resetCalls();
  const root = createRoot(dom.window.document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(DeployBuiltinModal, {
        title: 'Deploy catalog model',
        open: false,
        action: 'create',
        source: 'local_path',
        current: { id: 22, name: 'Catalog Model', categories: ['llm'] },
        onOk: empty,
        onCancel: empty
      })
    )
  );
  try {
    await act(async () => childProps.onClusterChange(2));
    assert.equal(evaluated.mock.callCount(), 1);
    return evaluated.mock.calls[0].result;
  } finally {
    await act(async () => root.unmount());
  }
};

const assertSourceAndRuntime = (values: any) => {
  assert.equal(values.source, 'huggingface');
  assert.equal(values.huggingface_repo_id, 'org/model-B');
  assert.equal(values.image_name, 'model-B:latest');
  assert.equal(values.run_command, 'serve-B');
  assert.equal(values.cluster_id, 2);
  assert.equal(values.name, 'catalog-model');
  for (const key of ['scheduleType', 'manualGpuMode', 'pdMode']) {
    assert.equal(
      Object.hasOwn(values, key),
      false,
      `${key} is a UI-only field`
    );
  }
};

test('cluster catalog evaluation uses committed PD clears and pinned replicas', async () => {
  const values = await fetchClusterSpec(true);
  assert.equal(values.replicas, 1);
  assert.deepEqual(values.extended_kv_cache, { enabled: false });
  assert.equal(values.gpu_selector, null);
  assert.equal(values.gpu_type_selector, null);
  assert.deepEqual(values.worker_selector, {});
  assert.deepEqual(values.backend_parameters, []);
  assert.deepEqual(values.env, {});
  assert.deepEqual(values.lora_list, []);
  assertSourceAndRuntime(values);
});

test('ordinary manual vGPU evaluation normalizes selectors and removes UI-only fields', async () => {
  const values = await fetchClusterSpec(
    false,
    {
      ...specB,
      gpu_type_selector: {
        type: 'type-B',
        accelerator_sliced_memory_percentage: 50,
        accelerator_sliced_cores_percentage: 25
      }
    },
    { manualGpuMode: 'vgpu' }
  );
  assert.equal(values.replicas, 7);
  assert.equal(values.gpu_selector, null);
  assert.equal(values.worker_selector, null);
  assert.deepEqual(values.gpu_type_selector, {
    type: 'type-B',
    accelerator_sliced_memory_percentage: 50,
    accelerator_sliced_cores_percentage: 25,
    accelerator_partitioned_profile: null
  });
  assert.equal(values.extended_kv_cache.enabled, true);
  assertSourceAndRuntime(values);
});
