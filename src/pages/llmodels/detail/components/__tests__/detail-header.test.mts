import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import type { ModelResourceMetrics } from '../../config/types';

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
const navigate = mock.fn();
const runBenchmark = mock.fn();
mock.module(
  new URL('../../../hooks/use-run-benchmark.ts', import.meta.url).href,
  {
    namedExports: {
      useBenchmarkTargetInstance: () => ({ runBenchmarkOnModel: runBenchmark })
    }
  }
);
mock.module('@umijs/max', {
  namedExports: {
    useNavigate: () => navigate,
    useIntl: () => ({
      formatMessage: ({ id }: any, values?: any) => {
        if (id === 'modelMonitoring.clusterFallback')
          return `Cluster #${values.id}`;
        if (id === 'models.openinplayground') return 'Open in Playground';
        if (id === 'models.table.button.apiAccessInfo') return 'API info';
        return id;
      }
    })
  }
});
mock.module('antd', {
  namedExports: {
    Button: ({ children, onClick, loading, disabled }: any) =>
      createElement(
        'button',
        { onClick, disabled, 'data-loading': !!loading },
        children
      ),
    Flex: ({ children }: any) => createElement('div', null, children),
    Row: ({ children }: any) => createElement('div', null, children),
    Col: ({ children }: any) => createElement('div', null, children),
    Descriptions: ({ items, bordered, column }: any) =>
      createElement(
        'dl',
        { 'data-bordered': bordered, 'data-columns': column },
        items.map(({ key, label, children }: any) =>
          createElement(
            'div',
            { key },
            createElement('dt', null, label),
            createElement('dd', null, children)
          )
        )
      ),
    Space: ({ children }: any) => createElement('div', null, children),
    Typography: {
      Title: ({ children }: any) => createElement('h1', null, children),
      Text: ({ children }: any) => createElement('span', null, children)
    }
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    CardWrapper: ({ children, style }: any) =>
      createElement('div', { 'data-summary-frame': true, style }, children),
    IconFont: () => null,
    icons: {
      Permission: createElement('span', { 'data-permission-icon': true })
    },
    ThemeTag: ({ children, icon }: any) =>
      createElement('span', { 'data-theme-tag': true }, icon, children),
    StatusDot: ({ statusValue }: any) =>
      createElement(
        'span',
        { 'data-status-dot': statusValue.status },
        statusValue.text
      ),
    StatusTag: ({ statusValue }: any) =>
      createElement(
        'span',
        { 'data-status-tag': statusValue.status, title: statusValue.message },
        statusValue.text
      )
  }
});
mock.module(
  new URL('../../../../_components/model-tag.tsx', import.meta.url).href,
  {
    defaultExport: ({ categoryKey }: any) =>
      createElement('span', { 'data-category': categoryKey }, categoryKey)
  }
);
mock.module(
  new URL('../../../components/api-access-info.tsx', import.meta.url).href,
  {
    defaultExport: ({ open, data, onClose }: any) =>
      open
        ? createElement(
            'section',
            { role: 'dialog', 'data-model-id': data.id },
            data.name,
            createElement('button', { onClick: onClose }, 'Close API info')
          )
        : null
  }
);
mock.module(
  new URL('../../../config/button-actions.ts', import.meta.url).href,
  {
    namedExports: { categoryToPathMap: { llm: '/playground/chat' } }
  }
);
mock.module(new URL('../../../../../plugins/index.ts', import.meta.url).href, {
  namedExports: { getGPUStackPlugin: () => ({}) }
});
mock.module(new URL('../../../../../atoms/user.ts', import.meta.url).href, {
  namedExports: {
    getCurrentOrg: () => ({ id: 99, name: 'wrong-current-org' }),
    getOrgById: (id: number) =>
      id === 42 ? { id: 42, name: 'owner-org' } : null
  }
});
let currentTenant = 'tenant-a';
mock.module(
  new URL('../../hooks/use-monitoring-data.ts', import.meta.url).href,
  {
    namedExports: { tenantKey: () => currentTenant }
  }
);
const metadata = (model: any) => ({
  clusterName: `Readable cluster ${model.cluster_id}`,
  target: {
    model_id: model.id,
    state: 'active',
    route_id: model.id + 100,
    route_name: `actual-route-${model.id}`
  }
});
let respond: (model: any) => Promise<any> = async (model) => metadata(model);
const lookup = mock.fn((model: any) => respond(model));
mock.module(
  new URL('../../services/header-metadata.ts', import.meta.url).href,
  {
    namedExports: { queryHeaderMetadata: lookup }
  }
);
mock.module(new URL('../view-deployment-yaml.tsx', import.meta.url).href, {
  defaultExport: ({ model }: any) =>
    createElement('button', { 'data-yaml-model': model.id }, 'View YAML')
});
const { createRoot } = await import('react-dom/client');
const { default: DetailHeader } = await import('../detail-header');
const baseModel = {
  id: 7,
  name: 'deployment-name',
  state: 'running',
  backend: 'vLLM',
  backend_version: 'latest',
  cluster_id: 9,
  owner_principal_id: 42,
  categories: ['llm'],
  replicas: 2,
  ready_replicas: 2
};
const deferred = () => {
  let resolve!: (value: any) => void;
  const promise = new Promise((yes) => {
    resolve = yes;
  });
  return { resolve, promise };
};
const mount = async (
  patch: any = {},
  cacheServices = {},
  resourceData: ModelResourceMetrics | null = null
) => {
  currentTenant = 'tenant-a';
  navigate.mock.resetCalls();
  runBenchmark.mock.resetCalls();
  lookup.mock.resetCalls();
  respond = async (model) => metadata(model);
  const root = createRoot(document.getElementById('root')!);
  const resources = mock.fn();
  const render = (model: any = { ...baseModel, ...patch }) =>
    act(async () =>
      root.render(
        createElement(DetailHeader, {
          key: `${currentTenant}:${model.id}:${model.cluster_id}:${model.owner_principal_id}`,
          model,
          tenant: currentTenant,
          deploymentMetadata: { ...metadata(model), cacheServices },
          resources: resourceData,
          onResources: resources
        })
      )
    );
  await render();
  const button = (name: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('button')].find(
      (item) => item.textContent === name
    );
  return {
    render,
    button,
    resources,
    unmount: () => act(async () => root.unmount())
  };
};

test('header shows deployment metadata and retains GPU navigation', async (t) => {
  const header = await mount(
    {
      huggingface_repo_id: 'Qwen/Qwen3-0.6B',
      state: 'partial',
      ready_replicas: 1,
      created_at: '2024-11-01T15:20:00',
      access_policy: 'authed',
      extended_kv_cache: { enabled: true, mode: 'shared', cache_service_id: 4 }
    },
    { 4: { name: 'Shared cache', provider: 'Provider' } },
    {
      allocated_gpu_count: 2,
      allocated_worker_count: 1
    } as ModelResourceMetrics
  );
  t.after(header.unmount);
  assert.ok(document.querySelector('[data-category="llm"]'));
  const cards = [
    ...document.querySelectorAll<HTMLElement>('[data-summary-frame]')
  ];
  assert.equal(cards.length, 3);
  const labelsByCard = cards.map((card) => {
    assert.equal(card.style.paddingBlock, '16px');
    const summary = card.querySelector('dl');
    assert.ok(summary);
    assert.equal(summary.getAttribute('data-bordered'), null);
    assert.equal(summary.getAttribute('data-columns'), '1');
    return [...summary.querySelectorAll('dt')];
  });
  assert.deepEqual(
    labelsByCard.map((labels) =>
      labels.map((label) => label.textContent?.replace('modelMonitoring.', ''))
    ),
    [
      ['backend', 'modelRoute', 'access'],
      ['deploymentCluster', 'readyInstances', 'gpuResources'],
      ['modelSource', 'cacheConfiguration', 'created']
    ]
  );
  const labels = labelsByCard.flat();
  const field = (label: string) =>
    labels.find((entry) => entry.textContent === `modelMonitoring.${label}`)
      ?.nextElementSibling;
  assert.equal(field('backend')?.textContent, 'vLLM latest');
  assert.equal(field('deploymentCluster')?.textContent, 'Readable cluster 9');
  assert.equal(field('readyInstances')?.textContent, '1 / 2');
  assert.ok(
    field('readyInstances')?.querySelector('[data-status-tag="warning"]')
  );
  assert.equal(field('modelSource')?.textContent, 'Qwen/Qwen3-0.6B');
  assert.equal(
    field('modelRoute')?.querySelector('[data-status-dot="success"]')
      ?.textContent,
    'actual-route-7'
  );
  assert.match(
    field('cacheConfiguration')?.querySelector('[data-theme-tag]')
      ?.textContent || '',
    /Shared cache · Provider/
  );
  assert.equal(field('created')?.textContent, '2024-11-01 15:20:00');
  const accessTag = field('access')?.querySelector('[data-theme-tag]');
  assert.equal(accessTag?.textContent, 'authed');
  assert.ok(
    accessTag?.querySelector('[aria-hidden="true"] [data-permission-icon]')
  );
  await act(async () => header.button('2 GPU · 1 Worker')!.click());
  assert.equal(header.resources.mock.callCount(), 1);
});

for (const pd of [false, true]) {
  test(`${pd ? 'PD' : 'ordinary'} header benchmarks the deployment through the existing handoff`, async (t) => {
    const header = await mount(
      pd
        ? {
            roles: [
              { name: 'prefill', replicas: 1 },
              { name: 'decode', replicas: 1 },
              { name: 'router', replicas: 1 }
            ]
          }
        : {}
    );
    t.after(header.unmount);
    await act(async () =>
      header.button('models.table.instance.benchmark')!.click()
    );
    assert.equal(runBenchmark.mock.callCount(), 1);
    assert.equal(runBenchmark.mock.calls[0].arguments[0].id, baseModel.id);
    assert.equal(runBenchmark.mock.calls[0].arguments[0].name, baseModel.name);
    assert.equal(
      runBenchmark.mock.calls[0].arguments[0].model_instance_name,
      undefined
    );
  });
}

test('Benchmark does not require a gateway route and rejects a stale tenant', async (t) => {
  const header = await mount();
  t.after(header.unmount);
  respond = async () => ({ clusterName: null, target: null });
  await act(async () => header.button('API info')!.click());
  assert.ok(header.button('models.table.instance.benchmark'));
  await act(async () =>
    header.button('models.table.instance.benchmark')!.click()
  );
  assert.equal(runBenchmark.mock.callCount(), 1);
  currentTenant = 'tenant-b';
  await act(async () =>
    header.button('models.table.instance.benchmark')!.click()
  );
  assert.equal(runBenchmark.mock.callCount(), 1);
});

test('header distinguishes manual stops, scheduled zero targets and unready deployments', async (t) => {
  const stopped = {
    ...baseModel,
    replicas: 0,
    ready_replicas: 0,
    state: 'pending'
  };
  const header = await mount(stopped);
  t.after(header.unmount);

  const badge = () =>
    document
      .querySelector('h1')
      ?.parentElement?.querySelector('[data-status-tag]');
  assert.equal(badge()?.textContent, 'models.mymodels.status.inactive');
  assert.equal(badge()?.getAttribute('data-status-tag'), 'inactive');
  const readyInstances = [...document.querySelectorAll('dt')].find(
    (label) => label.textContent === 'modelMonitoring.readyInstances'
  );
  assert.equal(readyInstances?.nextElementSibling?.textContent, '0 / 0');

  for (const [paused, label] of [
    [true, 'models.scaling.paused'],
    [false, 'models.scaling.waiting']
  ] as const) {
    await header.render({
      ...stopped,
      scaling_schedule: { enabled: true, paused }
    });
    assert.equal(badge()?.textContent, label);
  }

  await header.render({ ...stopped, replicas: 1 });
  assert.equal(badge()?.textContent, 'models.state.pending');
  assert.equal(
    badge()?.getAttribute('title'),
    'models.state.pending.noReadyInstances'
  );
  await header.render({
    ...stopped,
    replicas: 1,
    state_message: 'Worker is unreachable'
  });
  assert.equal(badge()?.getAttribute('title'), 'Worker is unreachable');
  await header.render({
    ...stopped,
    replicas: 1,
    state: 'error',
    state_message: 'Worker is unreachable'
  });
  assert.equal(badge()?.textContent, 'models.state.error');
  assert.equal(badge()?.getAttribute('title'), 'Worker is unreachable');
});

test('Benchmark entry follows the same ready LLM gate as deployment list actions', async (t) => {
  const header = await mount({ state: 'pending', ready_replicas: 4 });
  t.after(header.unmount);
  assert.equal(header.button('models.table.instance.benchmark'), undefined);
  await header.render({ ...baseModel, categories: ['embedding'] });
  assert.equal(header.button('models.table.instance.benchmark'), undefined);
});

test('PD shape shows ready and desired replicas and pending groups cannot expose serving actions', async (t) => {
  const header = await mount({
    state: 'pending',
    ready_replicas: 4,
    roles: [
      { name: 'prefill', replicas: 1 },
      { name: 'decode', replicas: 1 },
      { name: 'router', replicas: 1 }
    ],
    role_status: { prefill: { desired: 2, ready: 2 } }
  });
  t.after(header.unmount);
  assert.deepEqual(
    [...document.querySelectorAll('[data-status-dot]')]
      .filter((dot) => /^(Prefill|Decode|Router) /.test(dot.textContent || ''))
      .map((dot) => [dot.textContent, dot.getAttribute('data-status-dot')]),
    [
      ['Prefill 2 / 2', 'success'],
      ['Decode — / 1', 'inactive'],
      ['Router — / 1', 'inactive']
    ]
  );
  assert.ok(header.button('View YAML'));
  assert.equal(header.button('API info'), undefined);
  assert.equal(header.button('Open in Playground'), undefined);
});

test('serving actions use the actual route and owner namespace through the existing hooks', async (t) => {
  const header = await mount();
  t.after(header.unmount);
  await act(async () => header.button('API info')!.click());
  assert.equal(
    document.querySelector('[role="dialog"]')?.textContent,
    'owner-org/actual-route-7Close API info'
  );
  assert.equal(lookup.mock.callCount(), 2, 'click revalidates the route');
  await act(async () => header.button('Close API info')!.click());
  await act(async () => header.button('Open in Playground')!.click());
  assert.deepEqual(navigate.mock.calls.at(-1)?.arguments, [
    '/playground/chat?model=owner-org%2Factual-route-7'
  ]);
});

test('a denied or removed route cannot leave a serving action or stale API dialog', async (t) => {
  const header = await mount();
  t.after(header.unmount);
  respond = async () => ({ clusterName: null, target: null });
  await act(async () => header.button('API info')!.click());
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(header.button('Open in Playground'), undefined);
  assert.ok(document.body.textContent?.includes('Cluster #9'));
  assert.equal(
    document.querySelector('[data-status-dot="warning"]')?.textContent,
    'modelMonitoring.metadataUnavailable'
  );
});

test('a late serving lookup cannot open a dialog after switching models', async (t) => {
  const header = await mount();
  t.after(header.unmount);
  const pending = deferred();
  respond = async (model) =>
    model.id === 7 ? pending.promise : metadata(model);
  await act(async () => header.button('API info')!.click());
  await header.render({
    ...baseModel,
    id: 8,
    name: 'new-model',
    cluster_id: 10
  });
  await act(async () => pending.resolve(metadata(baseModel)));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(navigate.mock.callCount(), 0);
  assert.ok(document.body.textContent?.includes('new-model'));
  assert.ok(!document.body.textContent?.includes('Readable cluster 9'));
});

test('the current tenant and current servability are rechecked before an action opens', async (t) => {
  const header = await mount();
  t.after(header.unmount);
  const pending = deferred();
  respond = async () => pending.promise;
  await act(async () => header.button('API info')!.click());
  currentTenant = 'tenant-b';
  await act(async () => pending.resolve(metadata(baseModel)));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(navigate.mock.callCount(), 0);
});

test('a model becoming unservable while an action revalidates cannot open its API dialog', async (t) => {
  const header = await mount();
  t.after(header.unmount);
  const pending = deferred();
  respond = async () => pending.promise;
  await act(async () => header.button('API info')!.click());
  await header.render({ ...baseModel, state: 'pending' });
  await act(async () => pending.resolve(metadata(baseModel)));
  assert.equal(document.querySelector('[role="dialog"]'), null);
});

test('shared header owns exactly one YAML action before serving actions', async (t) => {
  const header = await mount();
  t.after(header.unmount);
  const actionLabels = [...document.querySelectorAll('button')]
    .map((button) => button.textContent)
    .filter((text) =>
      [
        'View YAML',
        'models.table.instance.benchmark',
        'API info',
        'Open in Playground'
      ].includes(text || '')
    );
  assert.deepEqual(actionLabels, [
    'View YAML',
    'models.table.instance.benchmark',
    'API info',
    'Open in Playground'
  ]);
  assert.equal(document.querySelectorAll('[data-yaml-model]').length, 1);
  assert.equal(
    document
      .querySelector('[data-yaml-model]')
      ?.getAttribute('data-yaml-model'),
    '7'
  );
  await header.render();
  assert.equal(document.querySelectorAll('[data-yaml-model]').length, 1);
});
