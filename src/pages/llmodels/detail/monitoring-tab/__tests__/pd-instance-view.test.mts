import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, useState } from 'react';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
let context: any, panel: any, viewControl: any;
const patches: any[] = [];
const box = forwardRef<HTMLDivElement, any>(({ children }, ref) =>
  createElement('div', { ref }, children)
);
mock.module('antd', {
  namedExports: { Flex: box, Button: box }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => context }
});
mock.module(
  new URL('../../components/pd-monitoring-content.tsx', import.meta.url).href,
  {
    defaultExport: (props: any) => {
      panel = props;
      return null;
    }
  }
);
mock.module(
  new URL('../../components/scope-toolbar.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../components/monitoring-view-control.tsx', import.meta.url).href,
  {
    defaultExport: (props: any) => {
      viewControl = props;
      return null;
    }
  }
);
mock.module(
  new URL('../../components/chart-interaction-help.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../components/hardware-content.tsx', import.meta.url).href,
  { namedExports: { HardwareContent: () => null } }
);
mock.module(
  new URL('../../components/metric-chart.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../components/metric-state.tsx', import.meta.url).href,
  {
    namedExports: { AvailabilityNotice: () => null, RequestNotice: () => null }
  }
);
mock.module(
  new URL('../../components/pd-role-overview.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../components/resource-table.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
for (const filename of [
  'pd-monitoring.module.less',
  'section-navigation.module.less'
]) {
  mock.module(new URL(`../components/${filename}`, import.meta.url).href, {
    defaultExport: {}
  });
}
mock.module(
  new URL('../components/section-navigation.tsx', import.meta.url).href,
  { defaultExport: ({ extra }: any) => extra || null }
);
mock.module(
  new URL('../components/monitoring-section-card.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
const { createRoot } = await import('react-dom/client');
const { default: PDMonitoringTab } =
  await import('../components/pd-monitoring');
const mount = async (initial: any = {}) => {
  patches.length = 0;
  const root = createRoot(document.getElementById('root')!);
  const Harness = () => {
    const [scope, setScope] = useState({
      window: '1h',
      role: 'all',
      instanceIds: [],
      view: 'aggregate',
      latencyMetric: 'tpot',
      ...initial
    });
    context = {
      scope,
      model: { data: { backend: 'vllm' } },
      instances: {
        data: [
          { id: 1, role: 'prefill', name: 'p-a' },
          { id: 2, role: 'decode', name: 'd-a' }
        ]
      },
      resources: { data: { devices: [] } },
      runtime: { data: { metrics: {} } },
      changeScope: (patch: any) => {
        patches.push(patch);
        setScope((previous: any) => ({ ...previous, ...patch }));
      }
    };
    return createElement(PDMonitoringTab);
  };
  await act(async () => root.render(createElement(Harness)));
  return () => act(async () => root.unmount());
};
test('PD monitoring does not inherit a single-instance focus from a table filter', async (t) => {
  t.after(await mount({ view: 'instances', instanceIds: [1] }));
  assert.equal(panel.view, 'instances');
  assert.equal(panel.focusedInstanceId, undefined);
  assert.equal(panel.onFocusChange, undefined);
  assert.equal(panel.instances.length, 2);
  assert.deepEqual(patches, []);
});

test('switching aggregate and instances changes only the view and keeps the whole role population', async (t) => {
  t.after(await mount());
  for (const view of ['instances', 'aggregate', 'instances']) {
    await act(async () => viewControl.onChange(view));
    assert.equal(panel.view, view);
    assert.equal(panel.instances.length, 2);
    assert.equal(panel.onFocusChange, undefined);
  }
  assert.deepEqual(patches, [
    { view: 'instances' },
    { view: 'aggregate' },
    { view: 'instances' }
  ]);
});
