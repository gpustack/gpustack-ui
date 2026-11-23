import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';
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
    }),
    request: (url: string, options: InventoryRequestOptions) =>
      requestInventory(url, options)
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    ColumnWrapper: ({ children }: any) =>
      createElement(Fragment, null, children),
    GSDrawer: ({ open, children }: any) =>
      open ? createElement(Fragment, null, children) : null,
    ModalFooter: empty,
    icons: {}
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
mock.module(
  new URL('../../../../cluster-management/apis/index.ts', import.meta.url).href,
  { namedExports: { queryClusterList: empty } }
);
mock.module('antd', { namedExports: { message: {} } });
mock.module(
  new URL('../../../../../utils/download-stream.ts', import.meta.url).href,
  { namedExports: { downloadFile: empty } }
);

const { useGenerateGPUOptions } =
  await import('../../../hooks/use-form-initial-values.ts');

type InventoryRequestOptions = {
  params: { cluster_id: number };
  signal?: AbortSignal;
};

const requests: {
  url: string;
  clusterId: number;
  signal?: AbortSignal;
  resolve: (response: { items: object[] }) => void;
}[] = [];

function requestInventory(
  url: string,
  { params, signal }: InventoryRequestOptions
) {
  return new Promise<{ items: object[] }>((resolve, reject) => {
    const abort = () => reject(signal?.reason);
    signal?.addEventListener('abort', abort, { once: true });
    requests.push({
      url,
      clusterId: params.cluster_id,
      signal,
      resolve: (response) => {
        signal?.removeEventListener('abort', abort);
        resolve(response);
      }
    });
  });
}

let store: any = {};
let writes: any[] = [];

// Use the real inventory hook. Mirror how rc-field-form exposes unregistered
// values: only getFieldsValue(true) includes the __injected record.
const DataForm = forwardRef((_props: any, ref: any) => {
  const { getGPUOptionList } = useGenerateGPUOptions();
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
    getGPUOptionList,
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

const mountModal = (t: TestContext) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  requests.length = 0;
  writes = [];
  const root = createRoot(dom.window.document.getElementById('root')!);
  const render = async (open: boolean, data: any) => {
    await act(async () =>
      root.render(
        createElement(UpdateModal, {
          action: 'edit',
          clusterList: [],
          currentData: {
            data,
            isGGUF: false
          },
          onCancel: () => {},
          onOk: () => {},
          open,
          title: 'edit'
        })
      )
    );
  };
  return {
    async open(roles: any[], clusterId = 1) {
      store = {
        backend: 'vLLM',
        cluster_id: clusterId,
        source: 'local_path',
        roles
      };
      await render(true, store);
    },
    close: () => render(false, {}),
    startInventory: () => act(async () => t.mock.timers.tick(100)),
    unmount: () => act(async () => root.unmount())
  };
};

const settleInventory = async (
  clusterId = 1,
  workerName = 'worker-a',
  gpuId = 'gpu-1'
) => {
  await act(async () => {
    for (const request of requests.filter(
      (entry) => entry.clusterId === clusterId
    )) {
      request.resolve({
        items:
          request.url === '/gpu-devices'
            ? [{ id: gpuId, name: gpuId, index: 0, worker_name: workerName }]
            : [{ name: workerName, state: 'ready' }]
      });
    }
  });
};

const lastRolesWrite = () => {
  const writesWithRoles = writes.filter((write) => 'roles' in write);
  return writesWithRoles.at(-1)?.roles;
};

test('GPU inventory hydration keeps the PD rows seeded while it was in flight', async (t) => {
  const modal = mountModal(t);
  try {
    await modal.open([role()]);
    await modal.startInventory();
    store = { ...store, roles: [seededRole()] };
    await settleInventory();
    const roles = lastRolesWrite();
    assert.ok(roles, 'expected the settled inventory to write the roles');
    assert.deepEqual(roles[0].backend_parameters, injected.params);
    assert.deepEqual(roles[0].env, injected.env);
    assert.deepEqual(roles[0].__injected, injected);
    assert.deepEqual(roles[0].gpu_selector.gpu_ids, [['worker-a', 'gpu-1']]);
    assert.equal(roles[0].gpu_selector.gpus_per_replica, 1);
  } finally {
    await modal.unmount();
  }
});

test('GPU inventory lifts role IDs before recipe defaults are seeded', async (t) => {
  const modal = mountModal(t);
  try {
    await modal.open([role()]);
    await modal.startInventory();
    await settleInventory();
    const roles = lastRolesWrite();
    assert.ok(roles, 'expected the settled inventory to write the roles');
    assert.deepEqual(roles[0].gpu_selector.gpu_ids, [['worker-a', 'gpu-1']]);
    assert.deepEqual(roles[0].backend_parameters, []);
    assert.equal(roles[0].__injected, undefined);
  } finally {
    await modal.unmount();
  }
});

test('no manual role GPU selection means no roles write', async (t) => {
  const roleWithoutSelection = role({
    gpu_selector: { gpu_ids: [], gpus_per_replica: null }
  });
  const modal = mountModal(t);
  try {
    await modal.open([roleWithoutSelection]);
    await modal.startInventory();
    await settleInventory();
    assert.equal(lastRolesWrite(), undefined);
  } finally {
    await modal.unmount();
  }
});

for (const closeFirst of [true, false]) {
  const action = closeFirst ? 'closing the drawer' : 'switching deployments';
  test(`${action} cancels both pending inventory requests`, async (t) => {
    const modal = mountModal(t);
    try {
      await modal.open([role()], 1);
      await modal.startInventory();
      const [gpuRequest, workerRequest] = requests;
      assert.deepEqual(
        requests.map(({ url }) => url),
        ['/gpu-devices', '/workers']
      );
      assert.ok(gpuRequest.signal);
      assert.equal(workerRequest.signal, gpuRequest.signal);
      assert.equal(gpuRequest.signal.aborted, false);

      if (closeFirst) {
        await modal.close();
        assert.equal(gpuRequest.signal.aborted, true);
      }
      const currentRole = role({
        gpu_selector: { gpu_ids: ['gpu-2'], gpus_per_replica: 1 }
      });
      await modal.open([currentRole], 2);
      assert.equal(gpuRequest.signal.aborted, true);
      assert.equal(workerRequest.signal?.aborted, true);
      assert.deepEqual(writes, []);

      await modal.startInventory();
      assert.deepEqual(
        requests.map(({ clusterId }) => clusterId),
        [1, 1, 2, 2]
      );
      assert.equal(requests[2].signal?.aborted, false);
      await settleInventory(2, 'worker-b', 'gpu-2');
      assert.deepEqual(store.roles[0].gpu_selector.gpu_ids, [
        ['worker-b', 'gpu-2']
      ]);
    } finally {
      await modal.unmount();
    }
  });
}

test('closing cancels the inventory timer before it can use a new drawer', async (t) => {
  const modal = mountModal(t);
  try {
    await modal.open([role()], 1);
    await modal.close();
    await modal.open([role()], 2);
    await modal.startInventory();
    assert.deepEqual(
      requests.map(({ clusterId }) => clusterId),
      [2, 2]
    );
    await settleInventory(2);
  } finally {
    await modal.unmount();
  }
});
