import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, mock, test } from 'node:test';
import React, { act, createElement, useEffect, useMemo, useState } from 'react';
import type { CacheProviderItem, ListItem } from '../config/types';
import type { ResourceCheckStatus } from '../hooks/use-placement-check';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const GiB = 1024 ** 3;
const workers = [
  {
    id: 1,
    name: 'worker-tight',
    labels: { pool: 'tight' },
    status: { memory: { total: 32 * GiB, used: 24 * GiB } }
  },
  {
    id: 2,
    name: 'worker-large',
    labels: { pool: 'large' },
    status: {
      memory: { total: 64 * GiB, used: 0 },
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

type Fixture = {
  catalog: ReturnType<typeof deferred<CacheProviderItem[]>>;
  workerList: ReturnType<typeof deferred<typeof workers>>;
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
        { key: option.value, value: option.value },
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
mock.module(new URL('../hooks/use-cache-providers.ts', import.meta.url).href, {
  defaultExport: (options?: { onLoaded?: () => void }) => {
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
});
mock.module(
  new URL('../../resources/services/use-query-worker-list.ts', import.meta.url)
    .href,
  {
    namedExports: {
      useQueryWorkerList: () => {
        const source = fixture;
        return useMemo(
          () => ({ fetchData: () => source.workerList.promise }),
          []
        );
      }
    }
  }
);
mock.module(
  new URL(
    '../../cluster-management/services/use-query-cluster-list.tsx',
    import.meta.url
  ).href,
  {
    namedExports: {
      useQueryClusterList: () => {
        const [clusterList, setClusterList] = useState<any[]>([]);
        const fetchClusterList = useMemo(
          () => async () => {
            const items = [
              { id: 1, value: 1, name: 'cluster', label: 'cluster' }
            ];
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
mock.module(new URL('./component-parameters.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module(new URL('./l2-storages.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module(new URL('./styled.tsx', import.meta.url).href, {
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
const { default: ServiceForm } = await import('./index.tsx');

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
const mount = async (action: 'create' | 'edit', currentData = saved) => {
  fixture = { catalog: deferred(), workerList: deferred() };
  const source = fixture;
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  const statuses: ResourceCheckStatus[] = [];
  const ref = React.createRef<any>();
  await act(async () => {
    root.render(
      createElement(ServiceForm, {
        ref,
        action,
        provider: provider.name,
        currentData: action === 'edit' ? currentData : undefined,
        onFinish: async () => {},
        onCheckStatusChange: (status: ResourceCheckStatus) =>
          statuses.push(status)
      })
    );
  });
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
    ref,
    changeNow,
    change: async (id: string, value: string) => {
      await changeNow(id, value);
      await settle();
    },
    ready: async (catalog = [provider]) => {
      await act(async () => source.catalog.resolve(catalog));
      await act(async () => source.workerList.resolve(workers));
      await settle();
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('edit checks placement only after relevant user edits, using the latest form values', async () => {
  const form = await mount('edit');
  try {
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
    assert.equal(form.statuses.at(-1)?.type, 'success');
    await form.change('config_fields_ram_size', '16');
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.form.ramSize.exceedsFree'
    );

    await form.change('provider_version', '2.0.0');
    assert.equal(form.statuses.at(-1)?.message, 'kvCache.check.noCpuImage');
    await form.change('provider_version', '1.0.0');
    await form.change('worker_selector', '{"pool":"large"}');
    assert.equal(form.statuses.at(-1)?.type, 'success');
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

test('editing a singleton worker recomputes placement for that worker', async () => {
  const form = await mount('edit', { ...saved, worker_id: 1 });
  try {
    await form.ready([{ ...provider, topology: 'replicas' }]);
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await form.change('worker_id', '2');
    assert.equal(form.statuses.at(-1)?.type, 'success');
    await form.change('worker_id', '1');
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.form.ramSize.exceedsFree'
    );
    assert.equal(form.statuses.filter((status) => status.show).length, 2);
  } finally {
    await form.unmount();
  }
});

test('a pending worker response checks an edited configuration, while resetting cancels pending checks', async () => {
  const form = await mount('edit');
  try {
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
      'kvCache.form.ramSize.exceedsTotal'
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
  const form = await mount('edit', { ...saved, worker_id: 1 });
  try {
    await act(async () => form.workerList.resolve(workers));
    await settle();
    assert.equal(
      form.statuses.some((status) => status.show),
      false
    );
    await form.change('worker_id', '2');
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
    assert.equal(form.ref.current.form.getFieldValue('worker_id'), 2);
    assert.equal(form.statuses.at(-1)?.type, 'success');
    assert.equal(form.statuses.at(-1)?.message, 'kvCache.check.ok.singleton');
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
    assert.equal(form.statuses.filter((status) => status.show).length, 1);
    assert.equal(form.statuses.at(-1)?.type, 'success');
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
    assert.equal(form.statuses.filter((status) => status.show).length, 1);
  } finally {
    await form.unmount();
  }
});

test('workers arriving during a pending edit merge into one placement check', async () => {
  const form = await mount('edit');
  try {
    await act(async () => form.catalog.resolve([provider]));
    await settle();
    await form.changeNow('config_fields_ram_size', '64');
    await act(async () => form.workerList.resolve(workers));
    await settle();

    assert.equal(form.statuses.filter((status) => status.show).length, 1);
    assert.equal(
      form.statuses.at(-1)?.message,
      'kvCache.form.ramSize.exceedsTotal'
    );
  } finally {
    await form.unmount();
  }
});

test('resetting allows the same placement snapshot to be checked in a new session', async () => {
  const form = await mount('edit');
  try {
    await form.ready();
    await form.change('config_fields_ram_size', '4');
    assert.equal(form.statuses.filter((status) => status.show).length, 1);

    await act(async () => {
      form.ref.current.resetFields();
      form.ref.current.form.setFieldsValue({ ...saved });
    });
    await settle();
    assert.equal(form.statuses.filter((status) => status.show).length, 1);
    await form.change('config_fields_ram_size', '4');
    assert.equal(form.statuses.filter((status) => status.show).length, 2);
    assert.equal(form.statuses.at(-1)?.type, 'success');
  } finally {
    await form.unmount();
  }
});
