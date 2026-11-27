import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost/'
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window)
  },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
Object.defineProperty(dom.window, 'matchMedia', {
  value: () => ({ matches: false, addListener() {}, removeListener() {} })
});
after(() => dom.window.close());

const localeMessages: Record<string, Record<string, string>> = {};
for (const locale of ['en-US', 'zh-CN', 'ja-JP', 'ru-RU', 'tr-TR']) {
  localeMessages[locale] = {
    ...(await import(`@/locales/${locale}/resources.ts`)).default,
    ...(await import(`@/locales/${locale}/resource-detail.ts`)).default
  };
}
let messages = localeMessages['en-US'];
const messageIDs: string[] = [];
mock.module('@umijs/max', {
  namedExports: {
    history: { push() {} },
    useIntl: () => ({
      formatMessage: (
        { id }: { id: string },
        values: Record<string, string | number> = {}
      ) => {
        messageIDs.push(id);
        assert.ok(messages[id], `Missing locale message: ${id}`);
        return messages[id].replace(/\{(\w+)\}/g, (_, key) =>
          String(values[key] ?? `{${key}}`)
        );
      }
    })
  }
});
const wrap = ({ children }: any) => createElement('div', {}, children);
mock.module('@gpustack/core-ui', {
  namedExports: {
    BaseSelect: () => null,
    CardWrapper: wrap,
    SectionTitle: wrap,
    StatusTag: () => null,
    ThemeTag: wrap,
    TextAttribute: wrap
  }
});
mock.module(new URL('../../../apis/index.ts', import.meta.url).href, {
  namedExports: { updateWorker: async () => {} }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    status: { ready: 'success', not_ready: 'inactive' },
    WorkerStatusMapValue: { ready: 'Ready', not_ready: 'Not Ready' }
  }
});
for (const module of [
  '../../../components/update-labels.tsx',
  '../../../components/worker-ssh-modal.tsx'
]) {
  mock.module(new URL(module, import.meta.url).href, {
    defaultExport: () => null
  });
}
mock.module(
  new URL('../../../../_components/monitoring/index.ts', import.meta.url).href,
  {
    namedExports: {
      HelpTooltip: () => null,
      ChartInteractionHelp: () => null,
      MetricChart: () => null
    }
  }
);
for (const module of [
  '../collection-notice.tsx',
  '../../instances-tab/index.tsx',
  '../../overview-tab/components/gpu-inventory.tsx'
]) {
  mock.module(new URL(module, import.meta.url).href, {
    defaultExport: () => null
  });
}
for (const module of [
  '../detail.module.less',
  '../../configuration-tab/index.module.less',
  '../../overview-tab/index.module.less'
]) {
  mock.module(new URL(module, import.meta.url).href, { defaultExport: {} });
}

const { createRoot } = await import('react-dom/client');
const { ResourceContext } = await import('../../config/context');
const { default: ResourceHeader } = await import('../resource-header');
const { default: ConfigurationTab } = await import('../../configuration-tab');
const { default: OverviewTab } = await import('../../overview-tab');

// The API retains one navigable placeholder when two raw chips share a logical
// index. Raw Worker GPU statuses have no ResourceDevice.id to match against.
const unresolvedDetail = JSON.parse(
  readFileSync(
    new URL('./fixtures/unresolved-device-detail.json', import.meta.url),
    'utf8'
  )
);
function resolvedDetail() {
  const data = structuredClone(unresolvedDetail);
  data.worker.status.gpu_devices[0] = {
    ...data.worker.status.gpu_devices[0],
    vendor: 'Huawei',
    type: 'cann',
    runtime_version: 'runtime-0'
  };
  // A physical device can report multiple chips with distinct logical indexes.
  data.worker.status.gpu_devices[1] = {
    ...data.worker.status.gpu_devices[1],
    index: 1,
    vendor: 'Huawei',
    type: 'cann',
    runtime_version: 'runtime-1'
  };
  data.devices[0] = {
    ...data.devices[0],
    name: 'chip-1',
    index: 1,
    chip_index: 1,
    reason: null,
    current: {
      gpu_utilization: 10,
      gpu_memory_used: 256,
      gpu_memory_total: 1024,
      gpu_power: 40,
      gpu_temperature: 35
    }
  };
  return data;
}

async function render(
  Component: typeof ConfigurationTab | typeof OverviewTab | typeof ResourceHeader,
  data = structuredClone(unresolvedDetail),
  kind: 'gpu' | 'worker' = 'gpu'
) {
  const root = createRoot(document.getElementById('root')!);
  const tabs: string[] = [];
  await act(async () =>
    root.render(
      createElement(
        ResourceContext.Provider,
        {
          value: {
            detail: { data, loading: false },
            metrics: {},
            target: {
              kind,
              id: '7',
              deviceId: kind === 'gpu' ? data.selected_device_id : undefined
            },
            scope: { window: '1h', start: 1700000000, end: 1700003600 },
            setTab: (tab: string) => tabs.push(tab),
            refresh: async () => {}
          } as any
        },
        createElement(Component)
      )
    )
  );
  return { tabs, unmount: () => act(async () => root.unmount()) };
}

test('configuration does not borrow UUID or driver/runtime from an unresolved raw chip', async () => {
  const data = structuredClone(unresolvedDetail);
  data.worker.status.gpu_devices.forEach((gpu: any, index: number) => {
    gpu.vendor = 'Huawei';
    gpu.type = 'cann';
    gpu.runtime_version = `runtime-${index}`;
  });
  const view = await render(ConfigurationTab, data);
  try {
    assert.doesNotMatch(
      document.body.textContent!,
      /GPU-[01]|driver-[01]|runtime-[01]|Huawei|cann/
    );
    assert.equal(
      document.querySelectorAll('.ant-descriptions-item-content')[4]
        .textContent,
      '—'
    );
  } finally {
    await view.unmount();
  }
});

test('gpu header summary leaves the unresolved device UUID unavailable', async () => {
  const view = await render(ResourceHeader);
  try {
    const uuid = [...document.querySelectorAll('.ant-descriptions-item-label')].find(
      (label) => label.textContent === 'GPU UUID'
    )!;
    assert.equal(uuid.nextElementSibling?.textContent, '—');
  } finally {
    await view.unmount();
  }
});

test('configuration preserves metadata for a uniquely indexed chip on a multi-chip device', async () => {
  const view = await render(ConfigurationTab, resolvedDetail());
  try {
    assert.match(document.body.textContent!, /Huawei/);
    assert.match(document.body.textContent!, /cann/);
    assert.match(document.body.textContent!, /GPU-1/);
    assert.match(document.body.textContent!, /driver-1/);
    assert.match(document.body.textContent!, /runtime-1/);
    assert.doesNotMatch(document.body.textContent!, /GPU-0|driver-0|runtime-0/);
  } finally {
    await view.unmount();
  }
});

test('gpu header summary preserves the matching UUID and scheduling allocation for a resolved chip', async () => {
  const view = await render(ResourceHeader, resolvedDetail());
  try {
    const labels = [...document.querySelectorAll('.ant-descriptions-item-label')];
    assert.equal(
      labels.find((label) => label.textContent === 'GPU UUID')!
        .nextElementSibling?.textContent,
      'GPU-1'
    );
    assert.equal(
      labels.find((label) => label.textContent === 'Allocated GPU memory')!
        .nextElementSibling?.textContent,
      '0 GiB'
    );
  } finally {
    await view.unmount();
  }
});

for (const kind of ['worker', 'gpu'] as const) {
  test(`${kind} related-instance action is a focusable native button that selects the instances tab`, async () => {
    const data = resolvedDetail();
    data.instances = [{ id: 1 }, { id: 2 }, { id: 3 }];
    if (kind === 'worker') data.selected_device_id = null;
    const view = await render(
      kind === 'worker' ? OverviewTab : ResourceHeader,
      data,
      kind
    );
    try {
      const action = [...document.querySelectorAll('button, a')].find(
        (element) =>
          element.textContent === (kind === 'worker' ? '3' : '3 instances')
      ) as HTMLButtonElement;
      assert.ok(action);
      assert.equal(action.tagName, 'BUTTON');
      assert.equal(action.type, 'button');
      assert.equal(action.tabIndex, 0);
      action.focus();
      assert.equal(document.activeElement, action);
      // Native buttons provide Tab/Enter activation; exercise the native click
      // path because JSDOM does not implement keyboard default actions.
      await act(async () => action.click());
      assert.deepEqual(view.tabs, ['instances']);
    } finally {
      await view.unmount();
    }
  });
}

test('configuration and header summary reuse existing resource label translations in all five locales', async () => {
  for (const [locale, dictionary] of Object.entries(localeMessages)) {
    messages = dictionary;
    try {
      messageIDs.length = 0;
      for (const [Component, kind] of [
        [ConfigurationTab, 'worker'],
        [ConfigurationTab, 'gpu'],
        [ResourceHeader, 'gpu']
      ] as const) {
        const data = resolvedDetail();
        if (kind === 'worker') data.selected_device_id = null;
        const view = await render(Component, data, kind);
        try {
          if (kind === 'gpu')
            assert.ok(
              document.body.textContent?.includes(
                dictionary['resources.worker']
              ),
              locale
            );
          else
            assert.ok(
              document.body.textContent?.includes(
                dictionary['resources.table.ip']
              ),
              locale
            );
        } finally {
          await view.unmount();
        }
      }
      for (const id of [
        'resources.worker',
        'resources.table.ip',
        'resources.table.gpu'
      ]) {
        assert.ok(messageIDs.includes(id), `${locale} should reuse ${id}`);
      }
      assert.ok(messageIDs.includes('resourceDetail.uuid'));
      assert.ok(messageIDs.includes('resourceDetail.gpuUuid'));
    } finally {
      messages = localeMessages['en-US'];
    }
  }
});
