import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useState, type ComponentProps } from 'react';

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost/',
  pretendToBeVisual: true
});
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLInputElement',
  'SVGElement',
  'ShadowRoot',
  'Element',
  'Node',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === 'window' ? dom.window : (dom.window as any)[key]
  });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true
});
Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
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
mock.module(
  new URL(
    '../../../../_components/monitoring/time-range-presets.module.less',
    import.meta.url
  ).href,
  { defaultExport: {} }
);
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});

const { Select } = await import('antd');
mock.module('@gpustack/core-ui', {
  namedExports: {
    BaseSelect: Select,
    GrafanaIcon: () => null,
    SimpleSelect: (props: ComponentProps<typeof Select>) =>
      createElement(Select, {
        ...props,
        className: 'test-simple-select',
        showSearch: props.showSearch ? { optionFilterProp: 'label' } : false
      })
  }
});
let monitoringEnabled = false;
const openMonitoringDashboard = mock.fn();
mock.module(
  new URL('../../../../resources/hooks/use-grafana-link.tsx', import.meta.url)
    .href,
  {
    defaultExport: () => ({
      showMonitoring: monitoringEnabled,
      goToModelMonitoringGrafana: openMonitoringDashboard
    })
  }
);
const messages: Record<string, string> = {
  window: '时间范围',
  instance: '实例',
  allInstances: '全部实例',
  role: '角色',
  allRoles: '全部角色',
  aggregate: '汇总',
  byInstance: '按实例',
  viewMode: '展示方式',
  clearInstances: '清空实例筛选，查看全部',
  refresh: '刷新',
  refreshInterval: '每 60 秒自动刷新',
  viewInGrafana: '在 Grafana 中查看'
};
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any) =>
        messages[id.replace('modelMonitoring.', '')] || id
    })
  }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: { isPDModel: (model: any) => !!model.roles?.length }
});
let context: any;
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => context }
});
const { createRoot } = await import('react-dom/client');
const { default: ScopeToolbar } = await import('../scope-toolbar');

const mount = async (patch: any = {}, toolbarProps: any = {}) => {
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  const changeScope = mock.fn();
  const refresh = mock.fn();
  const initialScope = {
    latencyMetric: 'tpot',
    window: '1h',
    instanceIds: [],
    role: 'all',
    view: 'aggregate',
    ...patch.scope
  };
  const Harness = () => {
    const [scope, setScope] = useState(initialScope);
    context = {
      model: { loading: false, data: { roles: [] } },
      instances: {
        loading: false,
        data: [
          { id: 101, name: 'qwen-prefill-0' },
          { id: 202, name: 'qwen-decode-0' }
        ]
      },
      runtime: { loading: false, data: { last_refreshed_at: 100 } },
      resources: { loading: false, data: { last_refreshed_at: 200 } },
      tab: 'monitoring',
      refresh,
      ...patch,
      scope,
      changeScope: (next: any) => {
        changeScope(next);
        setScope((previous: any) => ({ ...previous, ...next }));
      }
    };
    return createElement(ScopeToolbar, toolbarProps);
  };
  await act(async () => root.render(createElement(Harness)));
  return {
    container,
    changeScope,
    refresh,
    unmount: () => act(async () => root.unmount())
  };
};

test('instance search finds a named deployment instance with numeric IDs', async (t) => {
  const toolbar = await mount({ tab: 'instances' });
  t.after(toolbar.unmount);
  const input = toolbar.container.querySelector<HTMLInputElement>(
    'input[aria-label="实例"]'
  )!;
  assert.ok(input);
  await act(async () => {
    input.dispatchEvent(
      new dom.window.MouseEvent('mousedown', { bubbles: true })
    );
    Object.getOwnPropertyDescriptor(
      dom.window.HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, 'decode');
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  const options = [
    ...document.querySelectorAll<HTMLElement>('.ant-select-item-option-content')
  ];
  assert.ok(options.some((option) => option.textContent === 'qwen-decode-0'));
  assert.ok(!options.some((option) => option.textContent === 'qwen-prefill-0'));
  const option = options.find((item) => item.textContent === 'qwen-decode-0')!;
  await act(async () => option.click());
  assert.deepEqual(toolbar.changeScope.mock.calls.at(-1)?.arguments, [
    { instanceIds: [202] }
  ]);
});

for (const tab of ['instances', 'gpu'] as const) {
  test(`the ${tab} toolbar clears instances through the filter itself`, async (t) => {
    const toolbar = await mount({ tab, scope: { instanceIds: [202] } });
    t.after(toolbar.unmount);
    assert.equal(
      toolbar.container.querySelector(
        'button[aria-label="清空实例筛选，查看全部"]'
      ),
      null
    );
    const input = toolbar.container.querySelector<HTMLInputElement>(
      '.test-simple-select input[aria-label="实例"]'
    );
    assert.ok(input);
    assert.equal(input.labels?.length, 0);
    const clear = input
      .closest('.ant-select')
      ?.querySelector<HTMLElement>('.ant-select-clear');
    assert.ok(clear);
    await act(async () =>
      clear.dispatchEvent(
        new dom.window.MouseEvent('mousedown', { bubbles: true })
      )
    );
    assert.deepEqual(toolbar.changeScope.mock.calls.at(-1)?.arguments, [
      { instanceIds: [] }
    ]);
  });
}

test('GPU refresh stays busy without repeating the automatic-refresh sentence', async (t) => {
  const toolbar = await mount({
    tab: 'gpu',
    scope: { view: 'instances' },
    resources: { loading: true, data: { last_refreshed_at: 200 } }
  });
  t.after(toolbar.unmount);
  const button = toolbar.container.querySelector('button[aria-label="刷新"]')!;
  assert.ok(button.classList.contains('ant-btn-loading'));
  assert.ok(!toolbar.container.textContent?.includes('每 60 秒自动刷新'));
  assert.equal(
    toolbar.container.querySelector('[aria-label="展示方式"]'),
    null
  );
  assert.ok(
    toolbar.container.querySelector(
      '.test-simple-select input[aria-label="实例"]'
    )
  );
  assert.equal(toolbar.changeScope.mock.calls.length, 0);
});

test('the instance table does not expose a monitoring-only view mode', async (t) => {
  const toolbar = await mount({
    tab: 'instances',
    scope: { view: 'instances' }
  });
  t.after(toolbar.unmount);
  assert.equal(
    toolbar.container.querySelector('[aria-label="展示方式"]'),
    null
  );
  assert.ok(toolbar.container.querySelector('input[aria-label="实例"]'));
  assert.equal(toolbar.changeScope.mock.calls.length, 0);
});

test('labeled time and comparison controls apply their explicit scope changes', async (t) => {
  const toolbar = await mount();
  t.after(toolbar.unmount);
  assert.equal(
    toolbar.container.querySelector('input[aria-label="实例"]'),
    null
  );
  assert.equal(
    toolbar.container.querySelector('input[aria-label="角色"]'),
    null
  );
  const time = toolbar.container.querySelector(
    '[role="radiogroup"][aria-label="时间范围"]'
  )!;
  const day = [
    ...time.querySelectorAll<HTMLElement>('.ant-segmented-item')
  ].find((item) => item.textContent === '24h')!;
  assert.ok(day);
  await act(async () => day.click());
  assert.deepEqual(toolbar.changeScope.mock.calls.at(-1)?.arguments, [
    { window: '24h' }
  ]);
  for (const [label, patch] of [['按实例', { view: 'instances' }]] as const) {
    const option = [
      ...toolbar.container.querySelectorAll<HTMLElement>('.ant-segmented-item')
    ].find((item) => item.textContent === label)!;
    assert.ok(option);
    await act(async () => option.click());
    assert.deepEqual(toolbar.changeScope.mock.calls.at(-1)?.arguments, [patch]);
  }
  const comparison = toolbar.container.querySelector(
    '[aria-label="展示方式"]'
  )!;
  assert.ok(comparison);
  assert.ok(
    document.getElementById(comparison.getAttribute('aria-labelledby')!)
  );
});

test('time-range keyboard selection respects the backend query limit', async (t) => {
  const toolbar = await mount({
    scope: { window: '24h' },
    capabilities: { data: { max_query_seconds: 86400 }, stale: false }
  });
  t.after(toolbar.unmount);
  const group = toolbar.container.querySelector(
    '[role="radiogroup"][aria-label="时间范围"]'
  )!;
  const radio = (text: string) =>
    [...group.querySelectorAll('label')]
      .find((label) => label.textContent === text)
      ?.querySelector('input');
  assert.ok(radio('7d')?.disabled);
  const press = (key: string) =>
    act(async () =>
      radio('24h')!.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', { key, bubbles: true })
      )
    );
  await press('ArrowRight');
  assert.equal(toolbar.changeScope.mock.callCount(), 0);
  await press('ArrowLeft');
  assert.deepEqual(toolbar.changeScope.mock.calls.at(-1)?.arguments, [
    { window: '1h' }
  ]);
});

test('PD paired-view Grafana action carries the fixed interval and the displayed whole-role population', async (t) => {
  monitoringEnabled = true;
  openMonitoringDashboard.mock.resetCalls();
  const toolbar = await mount({
    model: { loading: false, data: { id: 7, roles: [{ name: 'decode' }] } },
    scope: {
      window: '1h',
      start: 1000,
      end: 4600,
      instanceIds: [202],
      role: 'decode'
    }
  });
  t.after(async () => {
    await toolbar.unmount();
    monitoringEnabled = false;
  });
  const action = [...toolbar.container.querySelectorAll('button')].find(
    (button) => button.textContent === '在 Grafana 中查看'
  )!;
  await act(async () => action.click());
  assert.deepEqual(openMonitoringDashboard.mock.calls.at(-1)?.arguments, [
    { id: 7 },
    { window: '1h', start: 1000, end: 4600, instanceIds: [], role: 'all' }
  ]);
});

test('the Grafana toolbar action carries the current native filter scope', async (t) => {
  monitoringEnabled = true;
  openMonitoringDashboard.mock.resetCalls();
  const toolbar = await mount({
    model: { loading: false, data: { id: 7, roles: [{ name: 'decode' }] } },
    tab: 'instances',
    scope: { window: '24h', instanceIds: [202], role: 'all' }
  });
  t.after(async () => {
    await toolbar.unmount();
    monitoringEnabled = false;
  });
  const action = [...toolbar.container.querySelectorAll('button')].find(
    (button) => button.textContent === '在 Grafana 中查看'
  )!;
  assert.ok(action);
  await act(async () => action.click());
  assert.deepEqual(openMonitoringDashboard.mock.calls.at(-1)?.arguments, [
    { id: 7 },
    { window: '24h', instanceIds: [202], role: 'all' }
  ]);
});

test('PD paired views keep time and comparison controls without hidden role filters', async (t) => {
  const toolbar = await mount({
    model: {
      loading: false,
      data: { roles: [{ name: 'prefill' }, { name: 'decode' }] }
    },
    scope: { role: 'prefill', instanceIds: [101] }
  });
  t.after(toolbar.unmount);
  assert.equal(
    toolbar.container.querySelector('input[aria-label="实例"]'),
    null
  );
  assert.equal(
    toolbar.container.querySelector('input[aria-label="角色"]'),
    null
  );
  assert.ok(
    toolbar.container.querySelector(
      '[role="radiogroup"][aria-label="时间范围"]'
    )
  );
  assert.ok(toolbar.container.querySelector('[aria-label="展示方式"]'));
});

test('PD instance inventory retains an explicit, labelled role filter', async (t) => {
  const toolbar = await mount({
    model: {
      loading: false,
      data: { roles: [{ name: 'prefill' }, { name: 'decode' }] }
    },
    tab: 'instances'
  });
  t.after(toolbar.unmount);
  const role = toolbar.container.querySelector<HTMLInputElement>(
    'input[aria-label="角色"]'
  )!;
  assert.ok(role);
  assert.equal(role.labels?.length, 0);
  await act(async () =>
    role.dispatchEvent(
      new dom.window.MouseEvent('mousedown', { bubbles: true })
    )
  );
  const prefill = [
    ...document.querySelectorAll<HTMLElement>('.ant-select-item-option-content')
  ].find((item) => item.textContent === 'Prefill')!;
  await act(async () => prefill.click());
  assert.deepEqual(toolbar.changeScope.mock.calls.at(-1)?.arguments, [
    { role: 'prefill' }
  ]);
});

test('embedded monitoring toolbar defers view mode to the section navigation bar', async (t) => {
  const toolbar = await mount({}, { embedded: true });
  t.after(toolbar.unmount);
  assert.equal(
    toolbar.container.querySelector('[aria-label="展示方式"]'),
    null
  );
  assert.ok(
    toolbar.container.querySelector(
      '[role="radiogroup"][aria-label="时间范围"]'
    )
  );
});
