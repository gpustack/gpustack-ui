import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
const navigate = mock.fn();
mock.module('@umijs/max', {
  namedExports: {
    useNavigate: () => navigate,
    useIntl: () => ({
      formatMessage: ({ id }: any, values?: any) => {
        if (id === 'modelMonitoring.instanceCount')
          return `${values.count} instances`;
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
    Space: ({ children }: any) => createElement('div', null, children),
    Typography: {
      Title: ({ children }: any) => createElement('h1', null, children),
      Text: ({ children }: any) => createElement('span', null, children)
    }
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    StatusTag: ({ statusValue }: any) =>
      createElement('span', null, statusValue.text)
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
const mount = async (patch: any = {}) => {
  currentTenant = 'tenant-a';
  navigate.mock.resetCalls();
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
          resources: null,
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

test('header shows category, readable cluster and ordinary replica shape', async (t) => {
  const header = await mount();
  t.after(header.unmount);
  assert.ok(document.querySelector('[data-category="llm"]'));
  assert.ok(document.body.textContent?.includes('Readable cluster 9'));
  assert.ok(document.body.textContent?.includes('2 instances'));
  await act(async () => header.button('modelMonitoring.gpuResources')!.click());
  assert.equal(header.resources.mock.callCount(), 1);
});

test('PD shape uses desired roles and pending groups cannot expose serving actions', async (t) => {
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
  assert.ok(
    document.body.textContent?.includes('Prefill 2 / Decode 1 / Router 1')
  );
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
