import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, mock, test } from 'node:test';
import React, { act, createElement, useEffect, useMemo, useState } from 'react';
import type { ClusterListItem } from '../../../cluster-management/config/types';
import type {
  CacheProviderItem,
  CacheServiceInstanceItem,
  FormData,
  ListItem
} from '../../config/types';
import type { ResourceCheckStatus } from '../../hooks/use-placement-check';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
};

const GiB = 1024 ** 3;
const workers = [
  {
    id: 1,
    name: 'worker-tight',
    state: 'ready',
    labels: { pool: 'tight' },
    status: { memory: { total: 32 * GiB, used: 24 * GiB, allocated: 24 * GiB } }
  },
  {
    id: 2,
    name: 'worker-large',
    state: 'ready',
    labels: { pool: 'large' },
    status: {
      memory: { total: 64 * GiB, used: 0, allocated: 0 },
      gpu_devices: [{ type: 'cuda' }]
    }
  }
];
const provider: CacheProviderItem = {
  name: 'test-cache',
  display_name: 'Test Cache',
  source: 'built_in',
  topology: 'per_node',
  default_version: '1.0.0',
  versions: {
    '1.0.0': { image: 'test:1' },
    '1.1.0': { image: 'test:1.1' },
    '2.0.0': {
      image: '',
      runtime_images: { cuda: { '12.8': 'test:2' } }
    }
  },
  fields: [
    { name: 'ram_size', type: 'number', default: 16, min: 1 },
    { name: 'transport', default: 'tcp' }
  ],
  resource_profile: { ram_gib: '{{ram_size}}' },
  inference_backend_integrations: []
};
const hardwareProvider: CacheProviderItem = {
  ...provider,
  default_version: '2.0.0',
  fields: [
    { name: 'ram_size', type: 'number', default: 4, min: 1 },
    {
      name: 'transport',
      default: 'tcp',
      framework_defaults: { cuda: 'cuda-ipc', cann: 'ascend' }
    }
  ]
};
const saved: ListItem = {
  id: 1,
  name: 'saved-cache',
  provider_name: provider.name,
  provider_version: '1.0.0',
  cluster_id: 1,
  config: { fields: { ram_size: 16, transport: 'tcp' } },
  state: 'running',
  created_at: '',
  updated_at: ''
};

const savedInstances = (service = saved): CacheServiceInstanceItem[] => [
  {
    id: service.id,
    name: `${service.name}-instance`,
    cache_service_id: service.id,
    worker_id: service.worker_id ?? 1,
    cluster_id: service.cluster_id,
    computed_resource_claim: {
      ram: (service.config?.fields?.ram_size ?? 16) * GiB
    },
    state: 'running',
    created_at: '',
    updated_at: ''
  }
];
type InstanceResponse = { items: CacheServiceInstanceItem[] };
type ClusterOption = Partial<ClusterListItem> & {
  id: number;
  value: number;
  name: string;
  label: string;
};
const clusters: ClusterOption[] = [
  { id: 1, value: 1, name: 'first', label: 'first' },
  { id: 2, value: 2, name: 'default', label: 'default', is_default: true }
];
type Fixture = {
  clusters: ReturnType<typeof deferred<ClusterOption[]>>;
  instances: Map<number, ReturnType<typeof deferred<InstanceResponse>>>;
  instanceRequests: number[];
  catalog: ReturnType<typeof deferred<CacheProviderItem[]>>;
  workerList: ReturnType<typeof deferred<typeof workers>>;
  debounceWorkers: boolean;
  workerRequests: {
    clusterId: number;
    response: ReturnType<typeof deferred<typeof workers>>;
  }[];
};
let fixture: Fixture;

// Keep Ant Design's real Form store and user-change notifications. Only
// presentation controls and remote option loaders are substituted.
const Input = ({ value, onChange, id, label }: any) =>
  createElement('input', {
    id,
    'aria-label': label,
    value: value ?? '',
    onChange
  });
const NumberInput = ({ value, onChange, id, label }: any) =>
  createElement('input', {
    id,
    'aria-label': label,
    type: 'number',
    value: value ?? '',
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange?.(event.target.value ? Number(event.target.value) : null)
  });
const Select = ({ value, onChange, id, label, options = [], disabled }: any) =>
  createElement(
    'select',
    {
      id,
      'aria-label': label,
      value: value ?? '',
      disabled,
      onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
        onChange?.(
          options.find(
            (option: any) => `${option.value}` === event.target.value
          )?.value
        )
    },
    createElement('option', { value: '' }, 'Auto'),
    options.map((option: any) =>
      createElement(
        'option',
        { key: option.value, value: option.value, disabled: option.disabled },
        option.label
      )
    )
  );
const ObjectInput = ({ value, onChange, id, label }: any) =>
  createElement('textarea', {
    id,
    'aria-label': label,
    value: JSON.stringify(value ?? {}),
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChange?.(JSON.parse(event.target.value))
  });

// core-ui is ESM-only, so the test runner uses --conditions=import. Point
// ahooks' tslib dependency at its equivalent CJS helpers: tsx otherwise
// transforms tslib's ESM re-export back onto itself under that condition.
const require = createRequire(import.meta.url);
const requireAhooks = createRequire(require.resolve('ahooks/package.json'));
const tslib = requireAhooks('tslib/tslib.js');
mock.module(requireAhooks.resolve('tslib'), {
  namedExports: tslib,
  defaultExport: tslib
});
const { useRequest } = await import('ahooks');

mock.module('@gpustack/core-ui', {
  namedExports: {
    Input: { Input },
    InputNumber: NumberInput,
    Select,
    CheckboxField: ({ checked, onChange, id }: any) =>
      createElement('input', {
        id,
        checked: !!checked,
        onChange,
        type: 'checkbox'
      }),
    LabelSelector: ObjectInput,
    LabelSelectorProvider: ({ children }: any) => children,
    CollapsePanel: ({ items }: any) =>
      createElement(
        'div',
        null,
        items.map((item: any) =>
          createElement(React.Fragment, { key: item.key }, item.children)
        )
      ),
    useAppUtils: () => ({ getRuleMessage: () => 'Required' }),
    IconFont: () => null,
    GrafanaIcon: () => null,
    icons: {}
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
    getLocale: () => 'en-US'
  }
});
mock.module(
  new URL('../../hooks/use-cache-providers.ts', import.meta.url).href,
  {
    defaultExport: function useCacheProviders(options?: {
      onLoaded?: () => void;
    }) {
      const source = fixture;
      const [providers, setProviders] = useState<CacheProviderItem[]>([]);
      useEffect(() => {
        let active = true;
        source.catalog.promise.then((items) => {
          if (active) {
            setProviders(items);
            options?.onLoaded?.();
          }
        });
        return () => {
          active = false;
        };
      }, []);
      return useMemo(
        () => ({
          providers,
          providerOptions: providers.map((item) => ({
            ...item,
            value: item.name,
            label: item.display_name
          })),
          getProvider: (name: string) =>
            providers.find((item) => item.name === name)
        }),
        [providers]
      );
    }
  }
);
mock.module(
  new URL(
    '../../../resources/services/use-query-worker-list.ts',
    import.meta.url
  ).href,
  {
    namedExports: {
      useQueryWorkerList: () => {
        const source = fixture;
        const { runAsync } = useRequest(
          ({ cluster_id }: { cluster_id: number }) => {
            const response = deferred<typeof workers>();
            source.workerRequests.push({ clusterId: cluster_id, response });
            return response.promise;
          },
          { manual: true, debounceWait: 300 }
        );
        return useMemo(
          () => ({
            fetchData: source.debounceWorkers
              ? runAsync
              : () => source.workerList.promise
          }),
          []
        );
      }
    }
  }
);
mock.module(
  new URL(
    '../../../cluster-management/services/use-query-cluster-list.tsx',
    import.meta.url
  ).href,
  {
    namedExports: {
      useQueryClusterList: () => {
        const source = fixture;
        const [clusterList, setClusterList] = useState<any[]>([]);
        const fetchClusterList = useMemo(
          () => async () => {
            const items = await source.clusters.promise;
            setClusterList(items);
            return items;
          },
          []
        );
        return { clusterList, fetchClusterList };
      }
    }
  }
);
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryCacheServiceInstances: (id: number) => {
      fixture.instanceRequests.push(id);
      if (!fixture.instances.has(id)) {
        fixture.instances.set(id, deferred<InstanceResponse>());
      }
      return fixture.instances.get(id)!.promise;
    }
  }
});
mock.module(new URL('../component-parameters.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module(new URL('../l2-storages.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module(new URL('../styled.tsx', import.meta.url).href, {
  namedExports: { OptionWithIcon: () => null }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost/'
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
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
const { createRoot } = await import('react-dom/client');
const { default: ServiceForm } = await import('../index.tsx');

beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
});
afterEach(() => {
  mock.timers.reset();
});

const settle = async () => {
  // Drive the real ahooks/lodash debounce with a controlled clock. A wall
  // clock sleep can finish before a rescheduled trailing call on busy CI.
  await act(async () => {
    mock.timers.tick(150);
  });
};
const mount = async (
  action: 'create' | 'edit',
  currentData = saved,
  options: { debounceWorkers?: boolean; deferClusters?: boolean } = {}
) => {
  fixture = {
    clusters: deferred(),
    catalog: deferred(),
    workerList: deferred(),
    debounceWorkers: !!options.debounceWorkers,
    workerRequests: [],
    instances: new Map([[currentData.id, deferred<InstanceResponse>()]]),
    instanceRequests: []
  };
  if (!options.deferClusters) {
    fixture.clusters.resolve([clusters[0]]);
  }
  const source = fixture;
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  const statuses: ResourceCheckStatus[] = [];
  const configChanges: boolean[] = [];
  const submissions: FormData[] = [];
  const failures: any[] = [];
  const ref = React.createRef<any>();
  const render = async (
    data = currentData,
    selectedProvider = provider.name
  ) => {
    await act(async () => {
      root.render(
        createElement(ServiceForm, {
          ref,
          action,
          provider: selectedProvider,
          currentData: action === 'edit' ? data : undefined,
          onFinish: async (values: FormData) => {
            submissions.push(values);
          },
          onFinishFailed: (error: any) => failures.push(error),
          onConfigChanged: (changed: boolean) => configChanges.push(changed),
          onCheckStatusChange: (status: ResourceCheckStatus) =>
            statuses.push(status)
        })
      );
    });
  };
  await render();
  const instancesReady = async (
    items = savedInstances(currentData),
    id = currentData.id
  ) => {
    await act(async () => source.instances.get(id)!.resolve({ items }));
  };
  const changeNow = async (id: string, value: string) => {
    const element = container.querySelector<HTMLInputElement>(`#${id}`)!;
    assert.ok(element, `Expected form control ${id}`);
    const prototype = Object.getPrototypeOf(element);
    await act(async () => {
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(
        element,
        value
      );
      element.dispatchEvent(
        new dom.window.Event(
          element.tagName === 'SELECT' ? 'change' : 'input',
          {
            bubbles: true
          }
        )
      );
    });
  };
  return {
    ...source,
    statuses,
    configChanges,
    submissions,
    failures,
    render,
    instancesReady,
    ref,
    changeNow,
    change: async (id: string, value: string) => {
      await changeNow(id, value);
      await settle();
    },
    ready: async (
      catalog = [provider],
      workerItems = workers,
      instances = savedInstances(currentData)
    ) => {
      await instancesReady(instances);
      await act(async () => source.catalog.resolve(catalog));
      await act(async () => source.workerList.resolve(workerItems));
      await settle();
    },
    submit: async () => {
      await act(async () => ref.current.submit());
    },
    toggle: async (id: string) => {
      const element = container.querySelector<HTMLInputElement>(`#${id}`)!;
      assert.ok(element, `Expected form control ${id}`);
      await act(async () => element.click());
      await settle();
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('new cache services select the default cluster after options load', async () => {
  const form = await mount('create', saved, { deferClusters: true });
  try {
    assert.equal(form.ref.current.form.getFieldValue('cluster_id'), undefined);
    await act(async () => form.clusters.resolve(clusters));
    assert.equal(form.ref.current.form.getFieldValue('cluster_id'), 2);

    await form.change('cluster_id', '1');
    await form.render(saved, 'another-provider');
    assert.equal(form.ref.current.form.getFieldValue('cluster_id'), 1);

    await act(async () => form.ref.current.resetFields());
    await form.render(saved, provider.name);
    assert.equal(form.ref.current.form.getFieldValue('cluster_id'), 2);
  } finally {
    await form.unmount();
  }
});

for (const state of ['empty', 'not_ready', 'unreachable', 'maintenance']) {
  test(`creation reports ${state} workers only in the placement alert and blocks submission`, async () => {
    const form = await mount('create');
    try {
      await form.ready(
        [provider],
        state === 'empty' ? [] : workers.map((worker) => ({ ...worker, state }))
      );
      await form.change('name', 'new-cache');
      assert.deepEqual(form.statuses.at(-1), {
        show: true,
        type: 'danger',
        message: 'kvCache.check.noReadyWorkers'
      });
      await form.submit();
      assert.equal(form.submissions.length, 0);
      assert.deepEqual(form.failures.at(-1).errorFields, []);
      assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);
      assert.equal(
        document
          .querySelector('#cluster_id')
          ?.closest('.ant-form-item-has-error'),
        null
      );
    } finally {
      await form.unmount();
    }
  });
}

test('a singleton defaults to a Ready worker and still submits with an advisory RAM warning', async () => {
  const form = await mount('create');
  try {
    await form.ready(
      [{ ...provider, topology: 'replicas' }],
      [workers[0], { ...workers[1], state: 'not_ready' }]
    );
    await form.change('name', 'new-cache');
    assert.equal(form.ref.current.form.getFieldValue('worker_id'), 1);
    assert.equal(
      (
        document.querySelector(
          '#worker_id option[value="2"]'
        ) as HTMLOptionElement
      ).disabled,
      true
    );
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.form.ramSize.exceedsFree'
    );
    await form.submit();
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].worker_id, 1);
  } finally {
    await form.unmount();
  }
});

for (const topology of ['per_node', 'replicas'] as const) {
  for (const first of ['workers', 'catalog']) {
    test(`${topology} creation ignores offline CUDA for versions and defaults when ${first} arrive first`, async () => {
      const form = await mount('create');
      const catalog = [{ ...hardwareProvider, topology }];
      const mixedWorkers = [workers[0], { ...workers[1], state: 'not_ready' }];
      try {
        if (first === 'workers') {
          await act(async () => form.workerList.resolve(mixedWorkers));
          await settle();
          await act(async () => form.catalog.resolve(catalog));
        } else {
          await act(async () => form.catalog.resolve(catalog));
          await settle();
          await act(async () => form.workerList.resolve(mixedWorkers));
        }
        await settle();
        assert.equal(
          form.ref.current.form.getFieldValue('provider_version'),
          '1.1.0'
        );
        assert.equal(
          form.ref.current.form.getFieldValue([
            'config',
            'fields',
            'transport'
          ]),
          'tcp'
        );
        assert.equal(
          document.querySelector('#provider_version option[value="2.0.0"]'),
          null
        );
        assert.equal(form.statuses.at(-1)?.type, 'success');
        if (topology === 'replicas') {
          assert.equal(
            (
              document.querySelector(
                '#worker_id option[value="2"]'
              ) as HTMLOptionElement
            ).disabled,
            true
          );
        }
        await form.change('name', 'ready-cpu-cache');
        await form.submit();
        assert.equal(form.submissions.length, 1);
        assert.equal(form.submissions[0].provider_version, '1.1.0');
      } finally {
        await form.unmount();
      }
    });
  }
}

test('Ready CUDA determines hardware defaults even when an offline worker reports another accelerator', async () => {
  const form = await mount('create');
  try {
    await form.ready(
      [hardwareProvider],
      [
        {
          ...workers[0],
          state: 'unreachable',
          status: { ...workers[0].status, gpu_devices: [{ type: 'cann' }] }
        },
        workers[1]
      ]
    );
    assert.equal(
      form.ref.current.form.getFieldValue('provider_version'),
      '2.0.0'
    );
    assert.equal(
      form.ref.current.form.getFieldValue(['config', 'fields', 'transport']),
      'cuda-ipc'
    );
    assert.equal(form.statuses.at(-1)?.type, 'success');
  } finally {
    await form.unmount();
  }
});

test('Ready-worker defaults preserve an explicit version and field choice made before workers arrive', async () => {
  const form = await mount('create');
  try {
    await act(async () => form.catalog.resolve([hardwareProvider]));
    await form.change('provider_version', '1.0.0');
    await form.change('config_fields_transport', 'manual-transport');
    await act(async () => form.workerList.resolve([workers[1]]));
    await settle();
    assert.equal(
      form.ref.current.form.getFieldValue('provider_version'),
      '1.0.0'
    );
    assert.equal(
      form.ref.current.form.getFieldValue(['config', 'fields', 'transport']),
      'manual-transport'
    );
  } finally {
    await form.unmount();
  }
});

test('editing keeps saved configuration and its existing version choices when CUDA is not Ready', async () => {
  const form = await mount('edit');
  try {
    await form.ready(
      [hardwareProvider],
      [workers[0], { ...workers[1], state: 'not_ready' }]
    );
    assert.equal(
      form.ref.current.form.getFieldValue('provider_version'),
      saved.provider_version
    );
    assert.equal(
      form.ref.current.form.getFieldValue(['config', 'fields', 'transport']),
      saved.config?.fields?.transport
    );
    assert.ok(
      document.querySelector('#provider_version option[value="2.0.0"]')
    );
    await form.change('name', 'renamed-cache');
    await form.submit();
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].provider_version, saved.provider_version);
  } finally {
    await form.unmount();
  }
});

test('switching clusters recomputes unpinned versions and defaults from the new Ready workers', async () => {
  const form = await mount('create', saved, {
    debounceWorkers: true,
    deferClusters: true
  });
  try {
    await act(async () => form.clusters.resolve(clusters));
    await act(async () => form.catalog.resolve([hardwareProvider]));
    await act(async () => mock.timers.tick(300));
    const cudaRequest = form.workerRequests.at(-1)!;
    assert.equal(cudaRequest.clusterId, 2);
    await act(async () => cudaRequest.response.resolve([workers[1]]));
    await settle();
    assert.equal(
      form.ref.current.form.getFieldValue('provider_version'),
      '2.0.0'
    );
    assert.equal(
      form.ref.current.form.getFieldValue(['config', 'fields', 'transport']),
      'cuda-ipc'
    );

    await form.changeNow('cluster_id', '1');
    await act(async () => mock.timers.tick(300));
    const cpuRequest = form.workerRequests.at(-1)!;
    assert.equal(cpuRequest.clusterId, 1);
    await act(async () =>
      cpuRequest.response.resolve([
        workers[0],
        { ...workers[1], state: 'not_ready' }
      ])
    );
    await settle();
    assert.equal(
      form.ref.current.form.getFieldValue('provider_version'),
      '1.1.0'
    );
    assert.equal(
      form.ref.current.form.getFieldValue(['config', 'fields', 'transport']),
      'tcp'
    );
    assert.equal(
      document.querySelector('#provider_version option[value="2.0.0"]'),
      null
    );
    assert.equal(form.statuses.at(-1)?.type, 'success');
  } finally {
    await form.unmount();
  }
});

test('selecting labels without Ready targets blocks creation and recovers after selecting Ready targets', async () => {
  const form = await mount('create');
  try {
    await form.ready(
      [provider],
      [workers[0], { ...workers[1], state: 'unreachable' }]
    );
    await form.change('name', 'new-cache');
    await form.change('config_fields_ram_size', '4');
    await form.change('worker_selector', '{"pool":"large"}');
    assert.equal(form.statuses.at(-1)?.type, 'danger');
    assert.equal(form.statuses.at(-1)?.message, 'kvCache.check.noReadyTargets');
    await form.submit();
    assert.equal(form.submissions.length, 0);

    await form.change('worker_selector', '{}');
    assert.equal(form.statuses.at(-1)?.type, 'success');
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);
    await form.submit();
    assert.equal(form.submissions.length, 1);
  } finally {
    await form.unmount();
  }
});

test('creation waits for worker status without marking the cluster invalid and submits when Ready workers arrive', async () => {
  const form = await mount('create');
  try {
    await act(async () => form.catalog.resolve([provider]));
    await form.change('name', 'new-cache');
    await form.submit();
    assert.equal(form.submissions.length, 0);
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);
    assert.deepEqual(form.statuses.at(-1), {
      show: true,
      type: 'transition',
      message: 'kvCache.check.workersLoading'
    });
    assert.equal(form.failures.length, 1);

    await act(async () => form.workerList.resolve([workers[1]]));
    await settle();
    assert.equal(form.statuses.at(-1)?.type, 'success');
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);
    await form.submit();
    assert.equal(form.submissions.length, 1);
  } finally {
    await form.unmount();
  }
});

test('a failed worker read shows an error and cannot be submitted as an empty or unchecked cluster', async () => {
  const form = await mount('create');
  try {
    await act(async () => form.catalog.resolve([provider]));
    await act(async () => form.workerList.reject(new Error('network failure')));
    await form.change('name', 'new-cache');
    assert.equal(form.statuses.at(-1)?.type, 'danger');
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.workersUnavailable'
    );
    await form.submit();
    assert.equal(form.submissions.length, 0);
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);
    assert.equal(form.failures.length, 1);
  } finally {
    await form.unmount();
  }
});

test('changing clusters blocks submission until the selected cluster has Ready workers', async () => {
  const form = await mount('create', saved, {
    debounceWorkers: true,
    deferClusters: true
  });
  try {
    await act(async () => form.clusters.resolve(clusters));
    await act(async () => form.catalog.resolve([provider]));
    await act(async () => mock.timers.tick(300));
    const initialRequest = form.workerRequests.at(-1)!;
    assert.equal(initialRequest.clusterId, 2);
    await act(async () => initialRequest.response.resolve([workers[1]]));
    await form.change('name', 'new-cache');
    assert.equal(form.statuses.at(-1)?.type, 'success');

    await form.changeNow('cluster_id', '1');
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    await form.submit();
    assert.equal(form.submissions.length, 0);
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);
    assert.equal(form.statuses.at(-1)?.type, 'transition');
    await act(async () => mock.timers.tick(300));
    const offlineRequest = form.workerRequests.at(-1)!;
    assert.equal(offlineRequest.clusterId, 1);
    await act(async () =>
      offlineRequest.response.resolve([{ ...workers[0], state: 'not_ready' }])
    );
    await settle();
    assert.equal(form.statuses.at(-1)?.message, 'kvCache.check.noReadyWorkers');
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);
    await form.submit();
    assert.equal(form.submissions.length, 0);
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), []);

    await form.changeNow('cluster_id', '2');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    await act(async () => mock.timers.tick(300));
    const readyRequest = form.workerRequests.at(-1)!;
    assert.equal(readyRequest.clusterId, 2);
    await act(async () => readyRequest.response.resolve([workers[1]]));
    await settle();
    assert.equal(form.statuses.at(-1)?.type, 'success');
    await form.submit();
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].cluster_id, 2);
  } finally {
    await form.unmount();
  }
});

for (const [name, options, expected] of [
  [
    'a GPU Service default alongside a model cluster',
    [{ ...clusters[1], k8s_options: { gpuInstanceOptions: {} } }, clusters[0]],
    1
  ],
  [
    'only a GPU Service cluster',
    [{ ...clusters[1], k8s_options: { gpuInstanceOptions: {} } }],
    undefined
  ],
  [
    'a model default alongside a GPU Service cluster',
    [
      { ...clusters[0], k8s_options: { gpuInstanceOptions: {} } },
      { ...clusters[1], k8s_options: {} }
    ],
    2
  ]
] as const) {
  test(`cache cluster picker disables GPU Service clusters with ${name}`, async () => {
    const form = await mount('create', saved, { deferClusters: true });
    try {
      await act(async () => form.clusters.resolve([...options]));
      assert.equal(form.ref.current.form.getFieldValue('cluster_id'), expected);
      for (const cluster of options) {
        const option = document.querySelector<HTMLOptionElement>(
          `#cluster_id option[value="${cluster.id}"]`
        );
        assert.ok(option, 'GPU Service clusters should remain visible');
        assert.equal(
          option.disabled,
          !!cluster.k8s_options?.gpuInstanceOptions
        );
      }
    } finally {
      await form.unmount();
    }
  });
}

test('creation still validates a missing cluster selection inline', async () => {
  const form = await mount('create', saved, { deferClusters: true });
  try {
    await act(async () => form.clusters.resolve([]));
    await act(async () => form.catalog.resolve([provider]));
    await form.change('name', 'new-cache');
    await form.submit();
    assert.equal(form.submissions.length, 0);
    assert.deepEqual(form.ref.current.form.getFieldError('cluster_id'), [
      'Required'
    ]);
  } finally {
    await form.unmount();
  }
});

test('metadata edits remain saveable when a service cluster has no Ready workers', async () => {
  const form = await mount('edit');
  try {
    await form.ready(
      [provider],
      workers.map((worker) => ({ ...worker, state: 'not_ready' }))
    );
    await form.change('name', 'renamed-cache');
    await form.submit();
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].name, 'renamed-cache');
  } finally {
    await form.unmount();
  }
});

for (const [name, options, expected] of [
  ['no clusters', [], undefined],
  ['one cluster', [clusters[0]], 1],
  [
    'multiple clusters without a default',
    clusters.map((item) => ({ ...item, is_default: false })),
    undefined
  ]
] as const) {
  test(`new cache services preserve selection rules for ${name}`, async () => {
    const form = await mount('create', saved, { deferClusters: true });
    try {
      await act(async () => form.clusters.resolve([...options]));
      assert.equal(form.ref.current.form.getFieldValue('cluster_id'), expected);
    } finally {
      await form.unmount();
    }
  });
}

test('editing a cache service keeps its cluster when the default differs', async () => {
  const form = await mount('edit', saved, { deferClusters: true });
  try {
    await act(async () => form.clusters.resolve(clusters));
    assert.equal(
      form.ref.current.form.getFieldValue('cluster_id'),
      saved.cluster_id
    );
  } finally {
    await form.unmount();
  }
});

test('editing only the version does not count an existing cache allocation twice', async () => {
  const form = await mount('edit', {
    ...saved,
    config: { fields: { ram_size: 15, transport: 'tcp' } }
  });
  try {
    await form.ready(
      [provider],
      [
        {
          ...workers[0],
          status: {
            memory: { total: 20 * GiB, used: 15 * GiB, allocated: 15 * GiB }
          }
        }
      ]
    );
    assert.equal(form.statuses.length, 0);

    await form.change('provider_version', '1.1.0');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    assert.equal(form.configChanges.at(-1), true);

    // Reverting an edit must not claim that currently free RAM was checked.
    await form.change('provider_version', '1.0.0');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    assert.equal(form.configChanges.at(-1), false);
  } finally {
    await form.unmount();
  }
});

test('edit checks placement only after relevant user edits, using the latest form values', async () => {
  const form = await mount('edit');
  try {
    await form.instancesReady();
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await act(async () => form.catalog.resolve([provider]));
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await act(async () => form.workerList.resolve(workers));
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );

    const count = form.statuses.length;
    await form.change('name', 'renamed-cache');
    await form.change('config_env', '{"EXAMPLE":"value"}');
    assert.equal(form.statuses.length, count);

    await form.change('config_fields_ram_size', '4');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    await form.change('config_fields_ram_size', '32');
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.recreate.insufficientRam'
    );
    await form.change('config_fields_ram_size', '16');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });

    await form.change('provider_version', '2.0.0');
    assert.equal(form.statuses.at(-1)?.message, 'kvCache.check.noCpuImage');
    await form.change('provider_version', '1.0.0');
    await form.change('worker_selector', '{"pool":"large"}');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    await form.change('worker_selector', '{"pool":"missing"}');
    assert.equal(form.statuses.at(-1)?.message, 'kvCache.check.noWorkers');

    const afterCheck = form.statuses.length;
    await form.change('name', 'renamed-again');
    await form.change('config_env', '{"EXAMPLE":"different"}');
    assert.equal(form.statuses.length, afterCheck);
  } finally {
    await form.unmount();
  }
});

test('editing a singleton worker checks the new target reservation budget', async () => {
  const form = await mount('edit', {
    ...saved,
    worker_id: 1,
    config: { fields: { ram_size: 48 } }
  });
  try {
    await form.ready([{ ...provider, topology: 'replicas' }]);
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await form.change('worker_id', '2');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    await form.change('worker_id', '1');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    assert.equal(form.statuses.length, 2);
  } finally {
    await form.unmount();
  }
});

test('a pending worker response checks an edited configuration, while resetting cancels pending checks', async () => {
  const form = await mount('edit');
  try {
    await form.instancesReady();
    await act(async () => form.catalog.resolve([provider]));
    await form.change('config_fields_ram_size', '64');
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await act(async () => form.workerList.resolve(workers));
    await settle();
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.recreate.insufficientRam'
    );

    // Queue a relevant user edit and reset before its debounce can run.
    const input = dom.window.document.getElementById(
      'config_fields_ram_size'
    ) as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, '128');
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      form.ref.current.resetFields();
    });
    const afterReset = form.statuses.length;
    await settle();
    assert.equal(form.statuses.length, afterReset);
  } finally {
    await form.unmount();
  }

  const reopened = await mount('edit');
  try {
    await reopened.ready();
    assert.equal(
      reopened.statuses.some((status) => status.show),
      false
    );
  } finally {
    await reopened.unmount();
  }
});

test('creation still checks the seeded configuration when workers arrive asynchronously', async () => {
  const form = await mount('create');
  try {
    await act(async () => form.catalog.resolve([provider]));
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await act(async () => form.workerList.resolve(workers));
    await settle();
    assert.equal(
      form.ref.current.form.getFieldValue('provider_version'),
      '1.0.0'
    );
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.form.ramSize.exceedsFree'
    );
    assert.equal(form.statuses.filter((status) => status.show).length, 1);
  } finally {
    await form.unmount();
  }
});

test('reset clears the edit gate before a delayed worker response arrives', async () => {
  const form = await mount('edit');
  try {
    await form.instancesReady();
    await act(async () => form.catalog.resolve([provider]));
    await form.change('config_fields_ram_size', '64');
    await act(async () => {
      form.ref.current.resetFields();
      // Rehydrate the saved service as a new drawer session would do.
      form.ref.current.form.setFieldsValue({ ...saved });
    });
    await act(async () => form.workerList.resolve(workers));
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
  } finally {
    await form.unmount();
  }
});

test('creation checks placement when the provider catalog arrives after workers', async () => {
  const form = await mount('create');
  try {
    await act(async () => form.workerList.resolve(workers));
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await act(async () => form.catalog.resolve([provider]));
    await settle();
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.form.ramSize.exceedsFree'
    );
    assert.equal(form.statuses.filter((status) => status.show).length, 1);
  } finally {
    await form.unmount();
  }
});

test('an edited singleton is checked when its catalog arrives after a worker change', async () => {
  const form = await mount('edit', {
    ...saved,
    worker_id: 2,
    config: { fields: { ram_size: 48 } }
  });
  try {
    await form.instancesReady();
    await act(async () => form.workerList.resolve(workers));
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await form.change('worker_id', '1');
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );

    // The eventual provider remains a singleton, so its arrival does not
    // change the worker-request effect's topology dependencies.
    await act(async () =>
      form.catalog.resolve([{ ...provider, topology: 'replicas' }])
    );
    await settle();
    assert.equal(form.ref.current.form.getFieldValue('worker_id'), 1);
    assert.equal(form.statuses.filter((status) => status.show).length, 1);
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.recreate.insufficientRam'
    );
  } finally {
    await form.unmount();
  }
});

test('rapid capacity and selector edits are checked once with the final values', async () => {
  const form = await mount('edit');
  try {
    await form.ready();
    await form.changeNow('config_fields_ram_size', '64');
    await form.changeNow('worker_selector', '{"pool":"large"}');
    await form.changeNow('config_fields_ram_size', '4');
    assert.equal(form.statuses.filter((status) => status.show).length, 0);

    await settle();
    assert.equal(form.statuses.length, 1);
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    assert.equal(
      form.ref.current.form.getFieldValue(['config', 'fields', 'ram_size']),
      4
    );
    assert.deepEqual(form.ref.current.form.getFieldValue('worker_selector'), {
      pool: 'large'
    });

    // A control can emit a newly allocated object with the same selection.
    // Its placement snapshot was already checked, even after debounce ends.
    await form.change('worker_selector', '{ "pool": "large" }');
    assert.equal(form.statuses.length, 1);
  } finally {
    await form.unmount();
  }
});

test('workers arriving during a pending edit merge into one placement check', async () => {
  const form = await mount('edit');
  try {
    await form.instancesReady();
    await act(async () => form.catalog.resolve([provider]));
    await settle();
    await form.changeNow('config_fields_ram_size', '64');
    await act(async () => form.workerList.resolve(workers));
    await settle();

    assert.equal(form.statuses.filter((status) => status.show).length, 1);
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.recreate.insufficientRam'
    );
  } finally {
    await form.unmount();
  }
});

for (const lateResult of ['resolve', 'reject'] as const) {
  test(`a stale worker ${lateResult} during the next request's debounce cannot finish a catalog topology update`, async () => {
    const form = await mount('edit', saved, { debounceWorkers: true });
    try {
      await form.instancesReady();
      await act(async () => mock.timers.tick(300));
      assert.deepEqual(
        form.workerRequests.map((request) => request.clusterId),
        [saved.cluster_id]
      );
      // The catalog reveals the saved provider's per-node topology and
      // queues another 300 ms worker fetch for the same cluster. The old
      // HTTP request is still live while the user edits its RAM capacity.
      await act(async () => form.catalog.resolve([provider]));
      await form.changeNow('config_fields_ram_size', '64');
      assert.equal(form.statuses.length, 0);
      await act(async () => {
        const stale = form.workerRequests[0].response;
        if (lateResult === 'reject') {
          stale.reject(new Error('old worker request failed'));
        } else {
          stale.resolve(workers);
        }
      });
      await settle();
      assert.equal(form.workerRequests.length, 1);
      assert.equal(
        form.statuses.length,
        0,
        'The pending current worker fetch must still gate placement checks'
      );

      await act(async () => mock.timers.tick(150));
      assert.deepEqual(
        form.workerRequests.map((request) => request.clusterId),
        [saved.cluster_id, saved.cluster_id]
      );
      await act(async () => form.workerRequests[1].response.resolve(workers));
      await settle();
      assert.equal(form.statuses.length, 1);
      assert.equal(
        form.statuses.at(-1)?.message,
        'kvCache.check.recreate.insufficientRam'
      );
    } finally {
      await form.unmount();
    }
  });
}

test('resetting allows the same placement snapshot to be checked in a new session', async () => {
  const form = await mount('edit');
  try {
    await form.ready();
    await form.change('config_fields_ram_size', '4');
    assert.equal(form.statuses.length, 1);

    await act(async () => {
      form.ref.current.resetFields();
      form.ref.current.form.setFieldsValue({ ...saved });
    });
    await settle();
    const afterReset = form.statuses.length;
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    await form.change('config_fields_ram_size', '4');
    assert.equal(form.statuses.length, afterReset + 1);
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
  } finally {
    await form.unmount();
  }
});

test('name and restart changes submit normally without checking placement', async () => {
  const form = await mount('edit');
  try {
    await form.ready();
    const initialChecks = form.statuses.length;
    await form.change('name', 'renamed-cache');
    await form.toggle('restart_on_error');
    assert.equal(form.statuses.length, initialChecks);
    assert.equal(form.configChanges.at(-1), false);

    await form.submit();
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].name, 'renamed-cache');
    assert.equal(form.submissions[0].restart_on_error, false);
  } finally {
    await form.unmount();
  }
});

test('a provider field unrelated to resource profiles does not trigger a placement check', async () => {
  const form = await mount('edit');
  try {
    await form.ready();
    const initialChecks = form.statuses.length;
    await form.change('config_fields_transport', 'rdma');
    await form.change('config_env', '{"DESCRIPTION":"updated"}');
    assert.equal(form.statuses.length, initialChecks);
    // Runtime configuration can still need recreation independently of RAM.
    assert.equal(form.configChanges.at(-1), true);

    await form.submit();
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].config?.fields?.transport, 'rdma');
  } finally {
    await form.unmount();
  }
});

test('recreation reports the RAM gap after crediting only the actual old instance claim', async () => {
  const current = {
    ...saved,
    config: { fields: { ram_size: 15, transport: 'tcp' } }
  };
  const form = await mount('edit', current);
  try {
    await form.ready(
      [provider],
      [
        {
          ...workers[0],
          status: {
            memory: {
              total: 20 * GiB,
              used: 18 * GiB,
              allocated: 18 * GiB
            }
          }
        }
      ],
      savedInstances(current)
    );
    await form.change('config_fields_ram_size', '18');
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.recreate.insufficientRam'
    );
    assert.equal(form.statuses.at(-1)?.type, 'warning');

    // Saving configuration is allowed; the warning concerns its recreation.
    await form.submit();
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].config?.fields?.ram_size, 18);

    await form.changeNow('config_fields_ram_size', '15');
    assert.equal(
      form.ref.current.form.getFieldValue(['config', 'fields', 'ram_size']),
      15
    );
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    const afterRestore = form.statuses.length;
    await settle();
    assert.equal(form.statuses.length, afterRestore);
    assert.equal(form.configChanges.at(-1), false);

    // Restoring clears the deduplication snapshot as well as the warning.
    await form.change('config_fields_ram_size', '18');
    assert.equal(form.statuses.length, afterRestore + 1);
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.recreate.insufficientRam'
    );
  } finally {
    await form.unmount();
  }
});

test('restoring relevant values cancels a queued check before late workers and instances arrive', async () => {
  const form = await mount('edit');
  try {
    await act(async () => form.catalog.resolve([provider]));
    await form.changeNow('config_fields_ram_size', '64');
    await form.changeNow('config_fields_ram_size', '16');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    const afterRestore = form.statuses.length;

    await act(async () => form.workerList.resolve(workers));
    await form.instancesReady();
    await settle();
    assert.equal(form.statuses.length, afterRestore);
    assert.equal(form.configChanges.at(-1), false);

    await form.change('name', 'only-name-remains');
    await form.submit();
    assert.equal(form.statuses.length, afterRestore);
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].name, 'only-name-remains');
  } finally {
    await form.unmount();
  }
});

test('a failed instance request warns only after a relevant edit and clears on restoration', async () => {
  const form = await mount('edit');
  try {
    await act(async () => form.catalog.resolve([provider]));
    await act(async () => form.workerList.resolve(workers));
    await act(async () =>
      form.instances.get(saved.id)!.reject(new Error('instances unavailable'))
    );
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );

    await form.change('name', 'renamed-without-claim-data');
    await form.submit();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    assert.equal(form.submissions.length, 1);

    await form.change('provider_version', '1.1.0');
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.recreate.unavailable'
    );
    await form.changeNow('provider_version', '1.0.0');
    assert.equal(
      form.ref.current.form.getFieldValue('provider_version'),
      '1.0.0'
    );
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    const afterRestore = form.statuses.length;
    await settle();
    assert.equal(form.statuses.length, afterRestore);
  } finally {
    await form.unmount();
  }
});

for (const lateResult of ['resolve', 'reject'] as const) {
  test(`a late instance ${lateResult} from the previous service does not replace the current resource budget`, async () => {
    const form = await mount('edit');
    const nextService = {
      ...saved,
      id: 2,
      name: 'next-service',
      config: { fields: { ram_size: 15, transport: 'tcp' } }
    };
    try {
      await act(async () => form.catalog.resolve([provider]));
      await act(async () =>
        form.workerList.resolve([
          {
            ...workers[0],
            status: {
              memory: {
                total: 20 * GiB,
                used: 18 * GiB,
                allocated: 18 * GiB
              }
            }
          }
        ])
      );
      await form.render(nextService);
      assert.deepEqual(form.instanceRequests, [saved.id, nextService.id]);
      await form.instancesReady(savedInstances(nextService), nextService.id);
      await settle();
      assert.equal(
        form.statuses.some((status) => status.show),
        false
      );

      await form.change('config_fields_ram_size', '18');
      assert.equal(
        form.statuses.at(-1)?.message,
        'kvCache.check.recreate.insufficientRam'
      );
      const currentChecks = form.statuses.length;
      await act(async () => {
        const stale = form.instances.get(saved.id)!;
        if (lateResult === 'reject') {
          stale.reject(new Error('old request failed'));
        } else {
          stale.resolve({
            items: [
              {
                ...savedInstances()[0],
                computed_resource_claim: { ram: 18 * GiB }
              }
            ]
          });
        }
      });
      await settle();
      assert.equal(form.statuses.length, currentChecks);
      assert.equal(
        form.statuses.at(-1)?.message,
        'kvCache.check.recreate.insufficientRam'
      );
      assert.equal(
        form.ref.current.form.getFieldValue('name'),
        nextService.name
      );
    } finally {
      await form.unmount();
    }
  });
}

test('resource field visibility gates are relevant even when the RAM amount is unchanged', async () => {
  const gatedProvider: CacheProviderItem = {
    ...provider,
    fields: [
      ...provider.fields!.map((field) =>
        field.name === 'ram_size'
          ? { ...field, visible_by: 'capacity_mode', visible_when: 'manual' }
          : field
      ),
      {
        name: 'capacity_mode',
        default: 'manual',
        options: ['manual', 'automatic']
      }
    ]
  };
  const form = await mount('edit', {
    ...saved,
    config: {
      fields: { ...saved.config?.fields, capacity_mode: 'manual' }
    }
  });
  try {
    await form.ready([gatedProvider]);
    const initialChecks = form.statuses.length;
    await form.change('config_fields_capacity_mode', 'automatic');
    assert.equal(form.statuses.length, initialChecks + 1);

    await form.changeNow('config_fields_capacity_mode', 'manual');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    const afterRestore = form.statuses.length;
    await settle();
    await form.change('config_fields_transport', 'rdma');
    assert.equal(form.statuses.length, afterRestore);
  } finally {
    await form.unmount();
  }
});

test('component replica and enabled gates trigger checks and restoring them clears the result', async () => {
  const componentProvider: CacheProviderItem = {
    ...provider,
    resource_profile: undefined,
    fields: [
      ...provider.fields!,
      { name: 'store_replicas', type: 'number', default: 1 },
      { name: 'store_enabled', type: 'boolean', default: true }
    ],
    components: {
      store: {
        topology: 'replicas',
        replicas_by: 'store_replicas',
        enabled_by: 'store_enabled',
        enabled_when: true,
        resource_profile: { ram_gib: '{{ram_size}}' }
      }
    }
  };
  const form = await mount('edit', {
    ...saved,
    config: {
      fields: {
        ...saved.config?.fields,
        store_replicas: 1,
        store_enabled: true
      }
    }
  });
  try {
    await form.ready([componentProvider]);
    await form.change('config_fields_store_replicas', '3');
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.check.store.insufficientWorkers'
    );
    await form.changeNow('config_fields_store_replicas', '1');
    assert.equal(
      form.ref.current.form.getFieldValue([
        'config',
        'fields',
        'store_replicas'
      ]),
      1
    );
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    await settle();
    const afterRestore = form.statuses.length;

    await form.toggle('config_fields_store_enabled');
    assert.equal(form.statuses.length, afterRestore + 1);
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
    await form.toggle('config_fields_store_enabled');
    assert.deepEqual(form.statuses.at(-1), { show: false, message: '' });
  } finally {
    await form.unmount();
  }
});

test('a metadata edit during a late singleton worker response keeps automatic placement and skips resource checks', async () => {
  const form = await mount('edit');
  try {
    await form.instancesReady();
    await act(async () =>
      form.catalog.resolve([{ ...provider, topology: 'replicas' }])
    );
    await settle();
    assert.equal(form.ref.current.form.getFieldValue('worker_id'), undefined);

    // Metadata changes before the worker-response debounce runs must not
    // turn a saved automatic placement into a newly pinned worker.
    await act(async () => form.workerList.resolve(workers));
    await form.changeNow('name', 'renamed-auto-placement');
    await settle();
    assert.equal(form.ref.current.form.getFieldValue('worker_id'), undefined);
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    assert.equal(form.configChanges.at(-1), false);

    await form.submit();
    assert.equal(form.submissions.length, 1);
    assert.equal(form.submissions[0].name, 'renamed-auto-placement');
    assert.equal(form.submissions[0].worker_id, undefined);
  } finally {
    await form.unmount();
  }
});
