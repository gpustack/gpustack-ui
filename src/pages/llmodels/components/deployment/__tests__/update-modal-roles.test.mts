import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import {
  Fragment,
  act,
  createElement,
  forwardRef,
  useImperativeHandle
} from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;

mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any) => id
    })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    ColumnWrapper: ({ children }: any) =>
      createElement(Fragment, null, children),
    GSDrawer: ({ children }: any) => createElement(Fragment, null, children),
    ModalFooter: empty
  }
});
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    PageAction: { CREATE: 'create', EDIT: 'edit' },
    StatusMaps: {}
  }
});
mock.module(new URL('../../../hooks/index.ts', import.meta.url).href, {
  namedExports: {
    useCheckCompatibility: () => ({
      checkTokenRef: { current: null },
      handleBackendChangeBefore: () => ({ show: false }),
      setWarningStatus: () => {},
      warningStatus: { show: false, message: '' }
    })
  }
});
mock.module(new URL('../../compatible-alert.tsx', import.meta.url).href, {
  defaultExport: empty
});

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
};

const inventory = deferred<any[]>();
let store: any = {};
let writes: any[] = [];

// Mirrors the two `DataForm` methods this test depends on. `getFieldsValue()`
// returns only registered fields, like rc-field-form: `__injected` is written
// with `setFieldValue`, so only the `true` form of the call carries it.
const DataForm = forwardRef((_props: any, ref: any) => {
  useImperativeHandle(ref, () => ({
    getBackendOptions: async () => {},
    getFieldsValue: (all = false) =>
      all
        ? store
        : {
            ...store,
            roles: store.roles?.map(
              ({ __injected: _injected, ...role }: any) => role
            )
          },
    getGPUOptionList: () => inventory.promise,
    setFieldsValue: (values: any) => {
      writes.push(values);
      store = { ...store, ...values };
    }
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
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Element: { configurable: true, value: dom.window.Element },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  getComputedStyle: { configurable: true, value: dom.window.getComputedStyle },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

const { default: UpdateModal } = await import('../update-modal.tsx');

const gpuOptions = [
  {
    label: 'worker-a',
    value: 'worker-a',
    parent: true,
    children: [{ label: 'GPU 1', value: 'gpu-1' }]
  }
];

const injected = {
  params: [
    '--kv-transfer-config {"kv_connector":"NixlConnector","kv_role":"kv_both"}',
    '--port {{ports.kv_port}}'
  ],
  env: {
    VLLM_NIXL_SIDE_CHANNEL_HOST: '{{worker_ip}}',
    UCX_NET_DEVICES: '{{net_device}}'
  }
};

const role = (overrides: any = {}) => ({
  name: 'prefill',
  replicas: 1,
  backend_parameters: [],
  env: {},
  gpu_selector: {
    gpu_ids: ['gpu-1'],
    gpus_per_replica: 1
  },
  ...overrides
});

const seededRole = () =>
  role({
    backend_parameters: [...injected.params],
    env: { ...injected.env },
    __injected: injected
  });

const renderModal = async (liveRoles: any[], snapshotRoles: any[]) => {
  store = {
    backend: 'vLLM',
    cluster_id: 1,
    source: 'local_path',
    roles: liveRoles
  };
  writes = [];
  const root = createRoot(dom.window.document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(UpdateModal, {
        action: 'edit',
        clusterList: [],
        currentData: {
          data: {
            backend: 'vLLM',
            cluster_id: 1,
            roles: snapshotRoles,
            source: 'local_path'
          },
          isGGUF: false
        },
        onCancel: () => {},
        onOk: () => {},
        open: true,
        title: 'edit'
      })
    )
  );
  // `update-modal` starts the inventory request after 100 ms.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 120));
  });
  return root;
};

const settleInventory = async () => {
  await act(async () => {
    inventory.resolve(gpuOptions);
    await inventory.promise;
  });
};

const lastRolesWrite = () => {
  const writesWithRoles = writes.filter((write) => 'roles' in write);
  return writesWithRoles.at(-1)?.roles;
};

test('GPU inventory hydration keeps the PD rows seeded while it was in flight', async () => {
  const root = await renderModal([seededRole()], [role()]);
  try {
    await settleInventory();
    const roles = lastRolesWrite();
    assert.ok(roles, 'expected the settled inventory to write the roles');
    assert.deepEqual(roles[0].backend_parameters, injected.params);
    assert.deepEqual(roles[0].env, injected.env);
    assert.deepEqual(roles[0].__injected, injected);
    assert.deepEqual(roles[0].gpu_selector.gpu_ids, [['worker-a', 'gpu-1']]);
    assert.equal(roles[0].gpu_selector.gpus_per_replica, 1);
  } finally {
    await act(async () => root.unmount());
  }
});

test('an inventory that settles first still lifts the role ids', async () => {
  const root = await renderModal([role()], [role()]);
  try {
    await settleInventory();
    const roles = lastRolesWrite();
    assert.ok(roles, 'expected the settled inventory to write the roles');
    assert.deepEqual(roles[0].gpu_selector.gpu_ids, [['worker-a', 'gpu-1']]);
    assert.deepEqual(roles[0].backend_parameters, []);
    assert.equal(roles[0].__injected, undefined);
  } finally {
    await act(async () => root.unmount());
  }
});

test('no manual role GPU selection means no roles write', async () => {
  const roleWithoutSelection = role({
    gpu_selector: { gpu_ids: [], gpus_per_replica: null }
  });
  const root = await renderModal(
    [roleWithoutSelection],
    [roleWithoutSelection]
  );
  try {
    await settleInventory();
    assert.equal(lastRolesWrite(), undefined);
  } finally {
    await act(async () => root.unmount());
  }
});
