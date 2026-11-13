import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useState } from 'react';

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

const { Select } = await import('antd');
mock.module('@gpustack/core-ui', {
  namedExports: { BaseSelect: Select, GrafanaIcon: () => null }
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

const mount = async (patch: any = {}) => {
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
      model: { loading: false, data: { roles: [{ name: 'decode' }] } },
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
    return createElement(ScopeToolbar);
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
  const toolbar = await mount();
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

test('a visible all-instances action clears the current instance selection', async (t) => {
  const toolbar = await mount({ scope: { instanceIds: [202] } });
  t.after(toolbar.unmount);
  const reset = toolbar.container.querySelector<HTMLButtonElement>(
    'button[aria-label="清空实例筛选，查看全部"]'
  );
  assert.ok(reset, 'the return-to-all action should not rely on a hover icon');
  await act(async () => reset.click());
  assert.deepEqual(toolbar.changeScope.mock.calls.at(-1)?.arguments, [
    { instanceIds: [] }
  ]);
});

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
  assert.ok(toolbar.container.querySelector('input[aria-label="实例"]'));
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

test('labeled time, role and comparison controls apply their explicit scope changes', async (t) => {
  const toolbar = await mount();
  t.after(toolbar.unmount);
  for (const name of ['实例', '角色']) {
    const input = toolbar.container.querySelector<HTMLInputElement>(
      `input[aria-label="${name}"]`
    )!;
    assert.ok(input.id);
    assert.equal(
      [...toolbar.container.querySelectorAll('label')].find(
        (label) => label.htmlFor === input.id
      )?.textContent,
      name
    );
  }
  const role = toolbar.container.querySelector<HTMLInputElement>(
    'input[aria-label="角色"]'
  )!;
  await act(async () => {
    role.dispatchEvent(
      new dom.window.MouseEvent('mousedown', { bubbles: true })
    );
  });
  const prefill = [
    ...document.querySelectorAll<HTMLElement>('.ant-select-item-option-content')
  ].find((item) => item.textContent === 'Prefill')!;
  assert.ok(prefill);
  await act(async () => prefill.click());
  assert.deepEqual(toolbar.changeScope.mock.calls.at(-1)?.arguments, [
    { role: 'prefill' }
  ]);
  const time = toolbar.container.querySelector<HTMLInputElement>(
    'input[aria-label="时间范围"]'
  )!;
  await act(async () =>
    time.dispatchEvent(
      new dom.window.MouseEvent('mousedown', { bubbles: true })
    )
  );
  const day = [
    ...document.querySelectorAll<HTMLElement>('.ant-select-item-option-content')
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

test('the Grafana toolbar action carries a fixed interval without losing instance and role scope', async (t) => {
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
    { window: '1h', start: 1000, end: 4600, instanceIds: [202], role: 'decode' }
  ]);
});

test('the Grafana toolbar action carries the current native filter scope', async (t) => {
  monitoringEnabled = true;
  openMonitoringDashboard.mock.resetCalls();
  const toolbar = await mount({
    model: { loading: false, data: { id: 7, roles: [{ name: 'decode' }] } },
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
