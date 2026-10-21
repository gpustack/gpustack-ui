import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, Fragment, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const InputField = ({ value }: any) =>
  createElement('span', null, String(value ?? ''));
const selectors = new Map<string, any>();
const SelectField = (props: any) => {
  selectors.set(props.label, props);
  return createElement(
    'span',
    { 'aria-label': props.label },
    JSON.stringify(props.value)
  );
};

mock.module('@gpustack/core-ui', {
  namedExports: {
    Cascader: SelectField,
    Select: SelectField,
    TextAttribute: passChildren,
    TooltipList: empty,
    IconFont: empty,
    ScrollSpyTabs: forwardRef((props: any, _ref) => passChildren(props)),
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
mock.module('ahooks', {
  namedExports: {
    useMemoizedFn: (callback: any) => {
      const callbackRef = useRef(callback);
      callbackRef.current = callback;
      const stableRef = useRef((...args: any[]) =>
        callbackRef.current(...args)
      );
      return stableRef.current;
    }
  }
});
mock.module(new URL('../../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    PageAction: { CREATE: 'create', EDIT: 'edit' },
    StatusMaps: {}
  }
});
mock.module(
  new URL('../../../model-routes/config/index.ts', import.meta.url).href,
  {
    namedExports: { TargetStatusValueMap: { Active: 'active' } }
  }
);
mock.module(
  new URL('../../../llmodels/hooks/use-run-benchmark.ts', import.meta.url).href,
  {
    namedExports: {
      useBenchmarkTargetInstance: () => ({
        benchmarkTargetInstance: {},
        clearBenchmarkTargetInstance() {}
      })
    }
  }
);

const plainModel = {
  id: 11,
  name: 'ordinary-first',
  replicas: 2,
  ready_replicas: 2,
  categories: ['llm'],
  state: 'running'
};
const sourceModel = {
  ...plainModel,
  id: 22,
  name: 'source-model'
};
const pdModel = {
  ...sourceModel,
  name: 'source-pd',
  replicas: 1,
  roles: [{ name: 'prefill' }, { name: 'decode' }, { name: 'router' }]
};
const instances = (model: any) => [
  {
    id: model.id * 10 + 1,
    name: `${model.name}-replica-1`,
    state: 'running',
    worker_id: 101,
    worker_name: 'worker-first'
  },
  {
    id: model.id * 10 + 2,
    name: `${model.name}-replica-2`,
    state: 'running',
    worker_id: 202,
    worker_name: 'worker-source'
  }
];
const clone = (value: any) => JSON.parse(JSON.stringify(value));
let models: any[] = [];
let members = new Map<number, any[]>();
let routes: any[] = [];
let fetchModels: (params: any) => Promise<any[]>;
let fetchInstances: (params: any) => Promise<any[]>;
let fetchRoutes: () => Promise<any[]>;
const modelRequests = mock.fn((params: any) => fetchModels(params));
const instanceRequests = mock.fn((params: any) => fetchInstances(params));
const routeRequests = mock.fn(async () => ({ items: await fetchRoutes() }));
mock.module(
  new URL('../../../llmodels/services/use-query-model-list.ts', import.meta.url)
    .href,
  {
    namedExports: {
      useQueryModelList: () => ({
        loading: false,
        fetchData: modelRequests,
        cancelRequest() {}
      })
    }
  }
);
mock.module(
  new URL(
    '../../../llmodels/services/use-query-model-instances.ts',
    import.meta.url
  ).href,
  {
    namedExports: {
      useQueryModelInstancesList: () => ({
        loading: false,
        fetchInstanceList: instanceRequests,
        cancelRequest() {}
      })
    }
  }
);
mock.module(
  new URL('../../../model-routes/apis/index.ts', import.meta.url).href,
  {
    namedExports: { queryRouteTargets: routeRequests }
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
const { App, Form } = await import('antd');
const { default: ModelInstanceForm } = await import('../model-instance.tsx');
let form: any;
// Retain the real parent prefill and async target picker. The unrelated basic
// fields are registered on the same real antd Form, without their own requests.
mock.module(new URL('../basic.tsx', import.meta.url).href, {
  defaultExport: function BasicFields() {
    form = Form.useFormInstance();
    return createElement(
      Fragment,
      null,
      [
        'cluster_id',
        'name',
        'model_id',
        'model_name',
        'model_instance_name'
      ].map((name) =>
        createElement(
          Form.Item,
          { key: name, name, hidden: true },
          createElement(InputField)
        )
      ),
      createElement(ModelInstanceForm)
    );
  }
});
mock.module(new URL('../dataset.tsx', import.meta.url).href, {
  defaultExport: empty
});
const { default: ProviderForm } = await import('../index.tsx');

const source = (model: any, member?: any) => ({
  name: 'cloned-benchmark',
  cluster_id: 1,
  model_id: model.id,
  model_name: model.name,
  model_instance_name: member?.name ?? '',
  dataset_name: 'Random',
  dataset_worker_id: 999,
  dataset_worker_name: 'stale-worker',
  dataset_input_tokens: 1024,
  dataset_output_tokens: 128,
  profile: 'Max Throughput'
});
const target = () => ({
  model_id: form.getFieldValue('model_id'),
  model_name: form.getFieldValue('model_name'),
  model_instance_name: form.getFieldValue('model_instance_name') || undefined,
  model_instance: form.getFieldValue('model_instance'),
  dataset_worker_id: form.getFieldValue('dataset_worker_id'),
  dataset_worker_name: form.getFieldValue('dataset_worker_name')
});
const expectTarget = (model: any, member?: any) => {
  assert.deepEqual(target(), {
    model_id: model.id,
    model_name: model.name,
    model_instance_name: member?.name,
    model_instance: member ? [model.name, member.name] : [model.name],
    dataset_worker_id: member?.worker_id,
    dataset_worker_name: member?.worker_name
  });
};
const expectEmptyTarget = async () => {
  for (const value of Object.values(target())) assert.ok(!value);
  await assert.rejects(form.validateFields(['model_instance']), (error: any) =>
    error.errorFields.some((field: any) => field.name[0] === 'model_instance')
  );
};
const renderForm = async (currentData?: any, options: any = {}) => {
  selectors.clear();
  modelRequests.mock.resetCalls();
  instanceRequests.mock.resetCalls();
  routeRequests.mock.resetCalls();
  fetchModels = options.fetchModels ?? (async () => clone(models));
  fetchInstances =
    options.fetchInstances ??
    (async ({ id }: any) => clone(members.get(id) ?? []));
  fetchRoutes = options.fetchRoutes ?? (async () => clone(routes));
  const root = createRoot(dom.window.document.getElementById('root')!);
  let completeSubmit: (() => void) | undefined;
  const submitted = mock.fn(async (_values: any) => completeSubmit?.());
  const rejected = mock.fn((_errorInfo: any) => completeSubmit?.());
  let props: any = {
    action: options.action ?? 'create',
    open: true,
    currentData,
    clusterList: [
      { value: 1, label: 'cluster-one' },
      { value: 2, label: 'cluster-two' }
    ],
    datasetList: [],
    profilesOptions: [],
    onFinish: submitted,
    onFinishFailed: rejected
  };
  const render = async (updates: any = {}) => {
    props = { ...props, ...updates };
    await act(async () =>
      root.render(createElement(App, null, createElement(ProviderForm, props)))
    );
  };
  await render();
  // antd's watcher subscribes after field registration on the initial mount.
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
  if (!currentData) await act(async () => form.setFieldValue('cluster_id', 1));
  return {
    render,
    submitted,
    rejected,
    submit: async () => {
      const finished = new Promise<void>((resolve) => {
        completeSubmit = resolve;
      });
      await act(async () => {
        form.submit();
        await finished;
      });
      completeSubmit = undefined;
    },
    changeMode: async (value: string) => {
      const selector = selectors.get('benchmark.form.targetMode');
      assert.ok(selector);
      await act(async () => selector.onChange(value));
    },
    changeCluster: async (value: number | undefined) => {
      await act(async () => form.setFieldValue('cluster_id', value));
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('a PD clone retains its deployment when an ordinary deployment is first', async () => {
  models = [plainModel, pdModel];
  members = new Map([[plainModel.id, instances(plainModel)]]);
  const view = await renderForm(source(pdModel));
  try {
    expectTarget(pdModel);
    assert.equal(instanceRequests.mock.callCount(), 0);
    assert.deepEqual(
      selectors
        .get('benchmark.form.target')
        .options.find((model: any) => model.id === pdModel.id).children,
      []
    );
  } finally {
    await view.unmount();
  }
});

test('an ordinary clone retains its exact replica and refreshes that replica worker', async () => {
  models = [plainModel, sourceModel];
  members = new Map([
    [plainModel.id, instances(plainModel)],
    [sourceModel.id, instances(sourceModel)]
  ]);
  const selected = instances(sourceModel)[1];
  const view = await renderForm(source(sourceModel, selected));
  try {
    expectTarget(sourceModel, selected);
    assert.deepEqual(
      instanceRequests.mock.calls.map(({ arguments: [params] }) => params.id),
      [sourceModel.id]
    );
    await act(async () => form.validateFields(['model_instance']));
  } finally {
    await view.unmount();
  }
});

test('plain create still defaults to the first running replica', async () => {
  models = [plainModel, sourceModel];
  const list = instances(plainModel);
  list[0].state = 'pending';
  members = new Map([[plainModel.id, list]]);
  const view = await renderForm();
  try {
    expectTarget(plainModel, list[1]);
  } finally {
    await view.unmount();
  }
});

for (const scenario of [
  'missing model',
  'unavailable model',
  'same name replacement',
  'missing replica',
  'unavailable replica'
]) {
  test(`a clone with ${scenario} requires a new target instead of a different deployment or replica`, async () => {
    const list = instances(sourceModel);
    models = [plainModel, sourceModel];
    if (scenario === 'missing model') models = [plainModel];
    if (scenario === 'unavailable model')
      models[1] = { ...sourceModel, state: 'partial' };
    if (scenario === 'same name replacement')
      models[1] = { ...sourceModel, id: 33 };
    members = new Map([
      [plainModel.id, instances(plainModel)],
      [sourceModel.id, list]
    ]);
    if (scenario === 'missing replica') members.set(sourceModel.id, [list[0]]);
    if (scenario === 'unavailable replica') list[1].state = 'pending';
    const view = await renderForm(
      source(sourceModel, instances(sourceModel)[1])
    );
    try {
      await act(async () => expectEmptyTarget());
    } finally {
      await view.unmount();
    }
  });
}

test('editing a route benchmark displays its snapshot route and can submit without current targets', async () => {
  models = [];
  routes = [];
  const currentData = {
    ...source(sourceModel),
    target_mode: 'route',
    snapshot: { route_name: 'historical-route' }
  };
  const view = await renderForm(currentData, { action: 'edit' });
  try {
    const selector = selectors.get('benchmark.form.target.route');
    assert.equal(selector.value, 'historical-route');
    assert.equal(selector.disabled, true);
    assert.ok(
      dom.window.document.body.textContent?.includes('historical-route')
    );
    assert.equal(modelRequests.mock.callCount(), 0);
    assert.equal(routeRequests.mock.callCount(), 0);
    await act(async () => form.validateFields(['route_name']));
    await view.submit();
    assert.equal(view.rejected.mock.callCount(), 0);
    assert.equal(view.submitted.mock.callCount(), 1);
    const payload = view.submitted.mock.calls[0].arguments[0];
    assert.equal(payload.route_name, 'historical-route');
    assert.equal(payload.model_id, sourceModel.id);
    assert.ok(!payload.model_instance);

    await view.render({ open: false });
    await view.render({
      open: true,
      currentData: {
        ...currentData,
        id: 2,
        snapshot: { route_name: 'another-route' }
      }
    });
    assert.equal(
      selectors.get('benchmark.form.target.route').value,
      'another-route'
    );
    await view.submit();
    assert.equal(
      view.submitted.mock.calls[1].arguments[0].route_name,
      'another-route'
    );
  } finally {
    await view.unmount();
  }
});

test('a route clone loads route choices and preserves the exact route from its snapshot', async () => {
  models = [plainModel, sourceModel];
  members = new Map([[plainModel.id, instances(plainModel)]]);
  routes = [
    {
      id: 1,
      route_name: 'first-route',
      model_id: plainModel.id,
      state: 'active',
      weight: 100
    },
    {
      id: 2,
      route_name: 'source-route',
      model_id: sourceModel.id,
      state: 'active',
      weight: 100
    }
  ];
  const view = await renderForm({
    ...source(sourceModel),
    target_mode: 'route',
    snapshot: { route_name: 'source-route' }
  });
  try {
    assert.equal(form.getFieldValue('target_mode'), 'route');
    assert.equal(form.getFieldValue('route_name'), 'source-route');
    assert.equal(form.getFieldValue('model_id'), sourceModel.id);
    assert.equal(form.getFieldValue('model_name'), sourceModel.name);
    assert.ok(!form.getFieldValue('model_instance'));
    assert.ok(!form.getFieldValue('model_instance_name'));
    assert.ok(!form.getFieldValue('dataset_worker_id'));
    assert.equal(instanceRequests.mock.callCount(), 0);
    assert.deepEqual(
      selectors
        .get('benchmark.form.target.route')
        .options.map((option: any) => option.value),
      ['first-route', 'source-route']
    );
  } finally {
    await view.unmount();
  }
});

test('a missing cloned route stays empty even when another route is available', async () => {
  models = [plainModel, sourceModel];
  routes = [
    {
      id: 1,
      route_name: 'other-route',
      model_id: plainModel.id,
      state: 'active',
      weight: 100
    }
  ];
  const view = await renderForm({
    ...source(sourceModel),
    target_mode: 'route',
    route_name: 'missing-route'
  });
  try {
    assert.ok(!form.getFieldValue('route_name'));
    await act(async () => assert.rejects(form.validateFields(['route_name'])));
  } finally {
    await view.unmount();
  }
});

test('switching a clone target mode and cluster allows a fresh default target', async () => {
  models = [plainModel, sourceModel];
  members = new Map([
    [plainModel.id, instances(plainModel)],
    [sourceModel.id, instances(sourceModel)]
  ]);
  routes = [
    {
      id: 1,
      route_name: 'only-route',
      model_id: plainModel.id,
      state: 'active',
      weight: 100
    }
  ];
  const view = await renderForm(source(sourceModel, instances(sourceModel)[1]));
  try {
    await view.changeMode('route');
    assert.equal(form.getFieldValue('route_name'), 'only-route');
    assert.ok(!form.getFieldValue('model_instance'));
    await view.changeMode('model_instance');
    expectTarget(plainModel, instances(plainModel)[0]);
    await view.changeCluster(2);
    expectTarget(plainModel, instances(plainModel)[0]);
  } finally {
    await view.unmount();
  }
});

test('an instance clone keeps route mode when returning to its source cluster', async () => {
  const otherModel = { ...plainModel, id: 33, name: 'cluster-two-model' };
  members = new Map([[sourceModel.id, instances(sourceModel)]]);
  routes = [
    {
      id: 1,
      route_name: 'cluster-one-route',
      model_id: plainModel.id,
      state: 'active',
      weight: 100
    },
    {
      id: 2,
      route_name: 'cluster-two-route',
      model_id: otherModel.id,
      state: 'active',
      weight: 100
    }
  ];
  const view = await renderForm(
    source(sourceModel, instances(sourceModel)[1]),
    {
      fetchModels: async ({ cluster_id }: any) =>
        clone(cluster_id === 1 ? [plainModel, sourceModel] : [otherModel])
    }
  );
  try {
    await view.changeMode('route');
    assert.equal(form.getFieldValue('route_name'), 'cluster-one-route');
    await view.changeCluster(2);
    assert.equal(form.getFieldValue('route_name'), 'cluster-two-route');
    assert.equal(form.getFieldValue('model_id'), otherModel.id);
    await view.changeCluster(1);
    assert.equal(form.getFieldValue('target_mode'), 'route');
    assert.equal(form.getFieldValue('route_name'), 'cluster-one-route');
    assert.equal(form.getFieldValue('model_id'), plainModel.id);
    assert.equal(form.getFieldValue('model_name'), plainModel.name);
    assert.ok(!form.getFieldValue('model_instance'));
    assert.deepEqual(
      selectors
        .get('benchmark.form.target.route')
        .options.map((route: any) => route.value),
      ['cluster-one-route']
    );
  } finally {
    await view.unmount();
  }
});

test('a route clone keeps instance mode when returning to its source cluster', async () => {
  const otherModel = { ...plainModel, id: 33, name: 'cluster-two-model' };
  members = new Map([
    [plainModel.id, instances(plainModel)],
    [otherModel.id, instances(otherModel)]
  ]);
  routes = [
    {
      id: 1,
      route_name: 'source-route',
      model_id: sourceModel.id,
      state: 'active',
      weight: 100
    }
  ];
  const view = await renderForm(
    {
      ...source(sourceModel),
      target_mode: 'route',
      route_name: 'source-route'
    },
    {
      fetchModels: async ({ cluster_id }: any) =>
        clone(cluster_id === 1 ? [plainModel, sourceModel] : [otherModel])
    }
  );
  try {
    await view.changeMode('model_instance');
    expectTarget(plainModel, instances(plainModel)[0]);
    await view.changeCluster(2);
    expectTarget(otherModel, instances(otherModel)[0]);
    await view.changeCluster(1);
    assert.equal(form.getFieldValue('target_mode'), 'model_instance');
    expectTarget(plainModel, instances(plainModel)[0]);
    assert.ok(!form.getFieldValue('route_name'));
    assert.deepEqual(
      selectors
        .get('benchmark.form.target')
        .options.map((model: any) => model.id),
      [plainModel.id, sourceModel.id]
    );
  } finally {
    await view.unmount();
  }
});

const deferred = () => {
  let resolve!: (value: any[]) => void;
  const promise = new Promise<any[]>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
};

for (const mode of ['instance', 'PD', 'route']) {
  test(`switching clusters clears the ${mode} target before the new request completes and blocks stale submission`, async () => {
    const pending = deferred();
    const firstModel = mode === 'PD' ? pdModel : sourceModel;
    const nextModel = { ...firstModel, id: 33, name: 'cluster-two-model' };
    const firstMember =
      mode === 'instance' ? instances(firstModel)[1] : undefined;
    members = new Map([
      [firstModel.id, instances(firstModel)],
      [nextModel.id, instances(nextModel)]
    ]);
    routes = [
      {
        id: 1,
        route_name: 'cluster-one-route',
        model_id: firstModel.id,
        state: 'active',
        weight: 100
      },
      {
        id: 2,
        route_name: 'cluster-two-route',
        model_id: nextModel.id,
        state: 'active',
        weight: 100
      }
    ];
    const currentData = {
      ...source(firstModel, firstMember),
      ...(mode === 'route'
        ? { target_mode: 'route', route_name: 'cluster-one-route' }
        : {})
    };
    const view = await renderForm(currentData, {
      fetchModels: async ({ cluster_id }: any) =>
        cluster_id === 1 ? clone([firstModel]) : pending.promise
    });
    try {
      assert.equal(form.getFieldValue('model_id'), firstModel.id);
      await act(async () => form.setFieldValue('name', 'user-named-benchmark'));
      await view.changeCluster(2);
      assert.equal(modelRequests.mock.calls.at(-1)?.arguments[0].cluster_id, 2);
      for (const [field, value] of Object.entries({
        ...target(),
        route_name: form.getFieldValue('route_name')
      })) {
        assert.ok(!value, `stale ${field} while the new cluster is loading`);
      }
      assert.equal(form.getFieldValue('name'), 'user-named-benchmark');
      const requiredField = mode === 'route' ? 'route_name' : 'model_instance';
      await act(async () =>
        assert.rejects(form.validateFields([requiredField]), (error: any) =>
          error.errorFields.some(
            (field: any) => field.name[0] === requiredField
          )
        )
      );
      await view.submit();
      assert.equal(view.submitted.mock.callCount(), 0);
      assert.equal(view.rejected.mock.callCount(), 1);
      assert.ok(
        view.rejected.mock.calls[0].arguments[0].errorFields.some(
          (field: any) => field.name[0] === requiredField
        )
      );

      await act(async () => pending.resolve(clone([nextModel])));
      if (mode === 'route') {
        assert.equal(form.getFieldValue('route_name'), 'cluster-two-route');
        assert.equal(form.getFieldValue('model_id'), nextModel.id);
        assert.equal(form.getFieldValue('model_name'), nextModel.name);
      } else {
        expectTarget(
          nextModel,
          mode === 'instance' ? instances(nextModel)[0] : undefined
        );
      }
      await view.submit();
      assert.equal(view.submitted.mock.callCount(), 1);
      const payload = view.submitted.mock.calls[0].arguments[0];
      assert.equal(payload.cluster_id, 2);
      assert.equal(payload.model_id, nextModel.id);
      assert.equal(payload.model_name, nextModel.name);
      assert.equal(
        payload.route_name,
        mode === 'route' ? 'cluster-two-route' : undefined
      );
      assert.equal(form.getFieldValue('name'), 'user-named-benchmark');
    } finally {
      await view.unmount();
    }
  });
}

test('clearing a cluster clears its route and bookkeeping without starting another request', async () => {
  models = [sourceModel];
  routes = [
    {
      id: 1,
      route_name: 'source-route',
      model_id: sourceModel.id,
      state: 'active',
      weight: 100
    }
  ];
  const view = await renderForm({
    ...source(sourceModel),
    target_mode: 'route',
    route_name: 'source-route'
  });
  try {
    assert.equal(form.getFieldValue('route_name'), 'source-route');
    const requestCount = modelRequests.mock.callCount();
    await view.changeCluster(undefined);
    assert.equal(modelRequests.mock.callCount(), requestCount);
    for (const [field, value] of Object.entries({
      ...target(),
      route_name: form.getFieldValue('route_name')
    })) {
      assert.ok(!value, `stale ${field} after the cluster is cleared`);
    }
    await view.submit();
    assert.equal(view.submitted.mock.callCount(), 0);
    assert.equal(view.rejected.mock.callCount(), 1);
  } finally {
    await view.unmount();
  }
});

test('manually clearing a cloned route ends loading and prevents a pending request from restoring it', async () => {
  const pending = deferred();
  models = [plainModel, sourceModel];
  const view = await renderForm(
    {
      ...source(sourceModel),
      target_mode: 'route',
      route_name: 'source-route'
    },
    { fetchRoutes: async () => pending.promise }
  );
  try {
    const selector = selectors.get('benchmark.form.target.route');
    assert.equal(selector.loading, true);
    assert.equal(selector.value, 'source-route');
    await act(async () => selector.onChange(undefined, undefined));
    assert.equal(selectors.get('benchmark.form.target.route').loading, false);
    assert.ok(!form.getFieldValue('route_name'));
    await act(async () =>
      pending.resolve([
        {
          id: 2,
          route_name: 'source-route',
          model_id: sourceModel.id,
          state: 'active',
          weight: 100
        }
      ])
    );
    assert.ok(!form.getFieldValue('route_name'));
    assert.ok(!form.getFieldValue('model_id'));
    assert.equal(selectors.get('benchmark.form.target.route').loading, false);
    assert.deepEqual(
      selectors
        .get('benchmark.form.target.route')
        .options.map((option: any) => option.value),
      []
    );
  } finally {
    await view.unmount();
  }
});

test('a late model list from the source cluster cannot replace a new cluster target', async () => {
  const pending = deferred();
  members = new Map([[plainModel.id, instances(plainModel)]]);
  const view = await renderForm(
    source(sourceModel, instances(sourceModel)[1]),
    {
      fetchModels: async ({ cluster_id }: any) =>
        cluster_id === 1 ? pending.promise : clone([plainModel])
    }
  );
  try {
    assert.equal(modelRequests.mock.callCount(), 1);
    await view.changeCluster(2);
    expectTarget(plainModel, instances(plainModel)[0]);
    await act(async () => pending.resolve(clone([sourceModel])));
    expectTarget(plainModel, instances(plainModel)[0]);
    assert.deepEqual(
      selectors
        .get('benchmark.form.target')
        .options.map((model: any) => model.id),
      [plainModel.id]
    );
  } finally {
    await view.unmount();
  }
});

test('a late replica list cannot restore the clone after switching to route mode', async () => {
  const pending = deferred();
  models = [plainModel, sourceModel];
  routes = [
    {
      id: 1,
      route_name: 'only-route',
      model_id: plainModel.id,
      state: 'active',
      weight: 100
    }
  ];
  const view = await renderForm(
    source(sourceModel, instances(sourceModel)[1]),
    {
      fetchInstances: async () => pending.promise
    }
  );
  try {
    assert.equal(instanceRequests.mock.callCount(), 1);
    await view.changeMode('route');
    assert.equal(form.getFieldValue('route_name'), 'only-route');
    assert.equal(form.getFieldValue('model_id'), plainModel.id);
    await act(async () => pending.resolve(clone(instances(sourceModel))));
    assert.equal(form.getFieldValue('route_name'), 'only-route');
    assert.equal(form.getFieldValue('model_id'), plainModel.id);
    assert.ok(!form.getFieldValue('model_instance'));
    assert.ok(!form.getFieldValue('dataset_worker_id'));
  } finally {
    await view.unmount();
  }
});

test('a late clone initialization cannot overwrite a manually selected target', async () => {
  const pending = deferred();
  models = [plainModel, sourceModel];
  const view = await renderForm(
    source(sourceModel, instances(sourceModel)[1]),
    {
      fetchInstances: async () => pending.promise
    }
  );
  try {
    assert.equal(instanceRequests.mock.callCount(), 1);
    const selected = instances(plainModel)[0];
    const selector = selectors.get('benchmark.form.target');
    const modelOption = selector.options.find(
      (model: any) => model.id === plainModel.id
    );
    await act(async () =>
      selector.onChange(
        [plainModel.name, selected.name],
        [modelOption, { ...selected, value: selected.name }]
      )
    );
    expectTarget(plainModel, selected);
    await act(async () => pending.resolve(clone(instances(sourceModel))));
    expectTarget(plainModel, selected);
  } finally {
    await view.unmount();
  }
});

test('closing the drawer prevents a late model request from selecting a target', async () => {
  const pending = deferred();
  const view = await renderForm(undefined, {
    fetchModels: async () => pending.promise
  });
  try {
    assert.equal(modelRequests.mock.callCount(), 1);
    await view.render({ open: false });
    const before = target();
    await act(async () => pending.resolve(clone([pdModel])));
    assert.deepEqual(target(), before);
    assert.deepEqual(selectors.get('benchmark.form.target').options, []);
  } finally {
    await view.unmount();
  }
});
