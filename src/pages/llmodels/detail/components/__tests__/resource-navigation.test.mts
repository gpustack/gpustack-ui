import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let context: any;
let selects: any[] = [],
  buttons: any[] = [],
  tables: any[] = [],
  charts: any[] = [],
  rowActions: any[] = [];
const passthrough = ({ children }: any) =>
  createElement(Fragment, null, children);
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: passthrough,
    CardWrapper: passthrough,
    CopyButton: () => null,
    icons: { Permission: null },
    SectionTitle: passthrough,
    TextAttribute: passthrough,
    ThemeTag: passthrough,
    StatusDot: () => null,
    useBodyScroll: () => ({
      saveScrollHeight() {},
      restoreScrollHeight() {}
    }),
    DropdownButtons: (props: any) => {
      rowActions.push(props);
      return null;
    },
    GSDrawer: ({ open, children }: any) =>
      open ? createElement('section', null, children) : null,
    Table: (props: any) => {
      tables.push(props);
      return null;
    }
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({
      styles: {
        card: 'pd-card',
        label: 'pd-label',
        value: 'pd-value',
        note: 'pd-note'
      }
    })
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
const Typography = Object.assign(passthrough, {
  Text: passthrough,
  Paragraph: passthrough,
  Title: passthrough
});
mock.module('antd', {
  namedExports: {
    Alert: () => null,
    Flex: passthrough,
    Col: passthrough,
    Row: passthrough,
    Space: passthrough,
    Tooltip: passthrough,
    Typography,
    Button: (props: any) => {
      buttons.push(props);
      return createElement('button', null, props.children);
    },
    Select: (props: any) => {
      selects.push(props);
      return null;
    },
    Descriptions: ({ items }: any) =>
      createElement(
        Fragment,
        null,
        items.map((item: any) =>
          createElement('div', { key: item.key }, item.children)
        )
      ),
    Empty: () => null,
    Spin: passthrough
  }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => context }
});
mock.module(new URL('../metric-chart.tsx', import.meta.url).href, {
  defaultExport: (props: any) => {
    charts.push(props);
    return null;
  }
});
mock.module(new URL('../performance-stats.tsx', import.meta.url).href, {
  defaultExport: () => null
});
const metadata = {
  key: 'overview-metadata',
  loading: false,
  stale: false,
  error: null,
  data: {
    clusterName: 'Readable cluster',
    target: { route_name: 'actual-route' },
    cacheServices: {}
  }
};
mock.module(
  new URL('../../hooks/use-deployment-metadata.ts', import.meta.url).href,
  {
    defaultExport: () => metadata
  }
);
mock.module(new URL('../deployment-cache-summary.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module(
  new URL(
    '../../configuration-tab/components/read-only-revisions.tsx',
    import.meta.url
  ).href,
  {
    defaultExport: () => null
  }
);
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    isPDModel: (model: any) => !!model.roles?.length,
    modelReplicaCounts: () => ({ ready: 2, total: 2 }),
    ModelStateMap: {},
    ModelStateLabelMap: {}
  }
});

const { DeviceDrawer, HardwareContent } = await import('../hardware-content');
const { default: ResourceTable } = await import('../resource-table');
const { default: OverviewTab } = await import('../../overview-tab');
const { default: ConfigurationTab } = await import('../../configuration-tab');

const metric = (role: string) => ({
  kind: 'histogram',
  unit: 'seconds',
  status: 'available',
  reason: null,
  measurement_scope: 'engine_local',
  supported_statistics: ['avg'],
  series: [
    { name: role, statistic: 'avg', dimensions: { role }, points: [[1, 2]] }
  ],
  summaries: [{ statistic: 'avg', dimensions: { role }, value: 2 }]
});
const prepare = () => {
  const device = {
    id: 'gpu-a',
    worker_id: 1,
    worker_name: 'worker',
    index: 0,
    chip_index: 0,
    name: 'GPU name',
    scope: 'physical_gpu',
    model_instance_ids: [7],
    history_available: false,
    current: {
      gpu_utilization: 0,
      gpu_memory_used: 1024 ** 3,
      gpu_memory_total: 80 * 1024 ** 3,
      gpu_temperature: 62
    },
    reason: null
  };
  selects = [];
  buttons = [];
  tables = [];
  charts = [];
  rowActions = [];
  context = {
    model: {
      data: {
        id: 1,
        name: 'PD model',
        roles: [{ name: 'prefill' }, { name: 'decode' }],
        backend: 'vLLM'
      }
    },
    resources: {
      loading: false,
      data: {
        available: true,
        devices: [
          device,
          { ...device, id: 'gpu-b', index: 1 },
          { ...device, id: 'other', index: 2, model_instance_ids: [8] }
        ],
        metrics: {},
        selected_device_id: 'gpu-a'
      }
    },
    instances: { data: [{ id: 7, name: 'decode-a', role: 'decode' }] },
    runtime: {
      data: {
        metrics: {
          input_tokens: {
            ...metric('prefill'),
            kind: 'counter',
            unit: 'tokens_per_second'
          },
          output_tokens: {
            ...metric('decode'),
            kind: 'counter',
            unit: 'tokens_per_second'
          },
          ttft: {
            ...metric('decode'),
            series: [...metric('prefill').series, ...metric('decode').series],
            summaries: [
              ...metric('prefill').summaries,
              ...metric('decode').summaries
            ]
          }
        }
      }
    },
    scope: {
      window: '1h',
      instanceIds: [],
      role: 'all',
      latencyMetric: 'tpot'
    },
    changeScope() {},
    setTab() {},
    inspectDevice() {},
    openMonitoringSection() {},
    tab: 'overview'
  };
};

test('drawer changes only between related visible devices and returns to their filtered instance list', () => {
  prepare();
  let inspected: any,
    filter: any,
    tab: any,
    closed = false;
  context.inspectDevice = (device: any) => (inspected = device.id);
  context.changeScope = (patch: any) => (filter = patch);
  context.setTab = (value: any) => (tab = value);
  const html = renderToStaticMarkup(
    createElement(DeviceDrawer, {
      deviceId: 'gpu-a',
      onClose() {
        closed = true;
      }
    })
  );
  assert.deepEqual(
    selects[0].options.map((option: any) => option.value),
    ['gpu-a', 'gpu-b']
  );
  assert.ok(selects[0].options[0].label.endsWith('/ GPU 0'));
  selects[0].onChange('other');
  assert.equal(inspected, undefined);
  selects[0].onChange('gpu-b');
  assert.equal(inspected, 'gpu-b');
  buttons
    .find(
      (button) => button.children === 'modelMonitoring.viewRelatedInstances'
    )
    .onClick();
  assert.equal(closed, true);
  assert.deepEqual(filter, { instanceIds: [7] });
  assert.equal(tab, 'instances');
  assert.ok(html.includes('decode-a'));
  assert.ok(html.includes('62'));
});

test('resource table retains authorized device rows and renders current zero utilization and missing memory distinctly', () => {
  prepare();
  let inspected: string | undefined;
  context.inspectDevice = (device: any) => {
    inspected = device.id;
  };
  context.resources.data.devices = context.resources.data.devices.slice(0, 1);
  renderToStaticMarkup(createElement(ResourceTable));
  const table = tables[0];
  assert.equal(table.loading, false);
  assert.equal(table.dataSource.length, 1);
  const utilization = table.columns.find(
    (column: any) => column.dataIndex === 'gpu_utilization'
  );
  assert.equal(utilization.sorter, true);
  assert.equal(utilization.render(null, table.dataSource[0]), '0 %');
  const memory = table.columns.find(
    (column: any) => column.dataIndex === 'gpu_memory'
  );
  assert.equal(memory.render(null, { current: {} }), '—');
  const association = table.columns.find(
    (column: any) => column.dataIndex === 'model_instance_ids'
  );
  assert.ok(renderToStaticMarkup(association.render([7])).includes('decode-a'));
  const actions = table.columns.find(
    (column: any) => column.dataIndex === 'id'
  );
  renderToStaticMarkup(actions.render(null, table.dataSource[0]));
  assert.equal(rowActions[0].items[0].label, 'modelMonitoring.viewDetails');
  rowActions[0].onSelect('details');
  assert.equal(inspected, 'gpu-a');
});

test('PD overview keeps ingress unavailable and shows separate P input and D output evidence', () => {
  prepare();
  const html = renderToStaticMarkup(createElement(OverviewTab));
  assert.deepEqual(
    charts.map((chart) => chart.metricKey),
    ['input_tokens', 'output_tokens']
  );
  assert.deepEqual(
    charts[0].metric.series.map((series: any) => series.dimensions.role),
    ['prefill']
  );
  assert.deepEqual(
    charts[1].metric.series.map((series: any) => series.dimensions.role),
    ['decode']
  );
  assert.ok(html.includes('data-pd-kpi="ingressTTFT"'));
  assert.ok(html.includes('modelMonitoring.pd.ingressUnavailable'));
  assert.ok(!html.includes('modelMonitoring.viewResources'));
  assert.ok(
    html.indexOf('modelMonitoring.pd.roleInstances') >
      html.indexOf('data-pd-kpi="dWaiting"')
  );
  assert.equal(
    charts.some((chart) => chart.metricKey === 'ttft'),
    false
  );
  assert.equal(
    tables.length,
    1,
    'PD overview ends with its role association table; physical inventory belongs to GPU resources'
  );
});

test('clicking a PD role link in overview filters the Instances tab to that role', () => {
  prepare();
  let scopePatch: any;
  let nextTab: any;
  context.changeScope = (patch: any) => (scopePatch = patch);
  context.setTab = (tab: any) => (nextTab = tab);
  renderToStaticMarkup(createElement(OverviewTab));
  const roleCol = tables[0].columns.find(
    (column: any) => column.dataIndex === 'role'
  );
  buttons = [];
  renderToStaticMarkup(roleCol.render('decode', tables[0].dataSource[1]));
  buttons[0].onClick();
  assert.deepEqual(scopePatch, { role: 'decode', instanceIds: [] });
  assert.equal(nextTab, 'instances');
});

test('ordinary overview lets users clear inherited instance filters directly', () => {
  prepare();
  context.model.data.roles = [];
  context.scope.instanceIds = [7];
  let scopePatch: any;
  context.changeScope = (patch: any) => (scopePatch = patch);
  renderToStaticMarkup(createElement(OverviewTab));
  const clearButton = buttons.find(
    (button) => button['aria-label'] === 'modelMonitoring.clearInstances'
  );
  assert.ok(clearButton);
  clearButton.onClick();
  assert.deepEqual(scopePatch, { role: 'all', instanceIds: [] });
});

test('PD overview leaves deployment identity and route to the page header', () => {
  prepare();
  const html = renderToStaticMarkup(createElement(OverviewTab));
  assert.ok(!html.includes('modelMonitoring.deploymentOverview'));
  assert.ok(!html.includes('PD model'));
  assert.ok(!html.includes('Readable cluster'));
  assert.ok(!html.includes('actual-route'));
});

test('a table instance filter does not erase the opposite PD role from overview evidence', () => {
  prepare();
  context.instances.data[0].role = 'prefill';
  context.scope.instanceIds = [7];
  renderToStaticMarkup(createElement(OverviewTab));
  assert.deepEqual(
    charts[0].metric.series.map((series: any) => series.dimensions.role),
    ['prefill']
  );
  assert.deepEqual(
    charts[1].metric.series.map((series: any) => series.dimensions.role),
    ['decode']
  );
  assert.ok(charts[0].title.startsWith('Prefill'));
});

test('configuration groups actual fields, preserves role parameter inheritance, and does not expose unrelated secrets or invented revision values', () => {
  prepare();
  Object.assign(context.model.data, {
    backend_parameters: ['--global-setting=1'],
    env: { PRIVATE_KEY: 'do-not-display' },
    roles: [
      { name: 'prefill', backend_parameters: ['--prefill-setting=2'] },
      { name: 'decode', backend_parameters: null }
    ]
  });
  const html = renderToStaticMarkup(createElement(ConfigurationTab));
  for (const key of [
    'modelAndBackend',
    'deploymentScheduling',
    'cacheEngineParameters',
    'revisionCapabilities'
  ]) {
    assert.ok(html.includes('modelMonitoring.' + key));
  }
  assert.equal(html.match(/--global-setting=1/g)?.length, 2);
  assert.equal(html.match(/--prefill-setting=2/g)?.length, 1);
  assert.equal(html.match(/vLLM/g)?.length, 3);
  assert.ok(!html.includes('do-not-display'));
  assert.ok(!html.includes('revision-0007'));
  assert.ok(!html.includes('32,768'));
  assert.ok(!html.includes('modelMonitoring.metricCapabilities'));
  assert.ok(!html.includes('modelMonitoring.generationView'));
  assert.ok(!html.includes('modelMonitoring.viewYaml'));
});

test('hardware charts show all associated resources without a GPU selector or a host-follow-GPU restriction', () => {
  prepare();
  const host = renderToStaticMarkup(
    createElement(HardwareContent, { host: true })
  );
  assert.equal(selects.length, 0);
  assert.deepEqual(
    charts.map((chart) => chart.metricKey),
    ['host_cpu', 'host_memory_used']
  );
  assert.ok(!host.includes('modelMonitoring.hostFollowsGPU'));
  renderToStaticMarkup(createElement(HardwareContent));
  assert.equal(selects.length, 0);
  assert.equal(charts.length, 6);
  assert.ok(
    charts.every((chart) => chart.colorDomain.includes('device:other'))
  );
});

test('GPU memory retains separate named used and total lines for every visible device', () => {
  prepare();
  const data = context.resources.data;
  data.all_devices = true;
  const gauge = (key: string, base: number) => ({
    kind: 'gauge',
    unit: 'bytes',
    status: 'available',
    reason: null,
    measurement_scope: 'physical_gpu',
    supported_statistics: ['current'],
    series: data.devices.map((device: any, index: number) => ({
      name: key,
      statistic: 'current',
      dimensions: { device_id: device.id, worker_id: device.worker_id },
      points: [[100, base + index]]
    })),
    summaries: []
  });
  data.metrics = {
    gpu_memory_used: gauge('gpu_memory_used', 1),
    gpu_memory_total: gauge('gpu_memory_total', 10)
  };
  const source = JSON.stringify(data);
  renderToStaticMarkup(createElement(HardwareContent));
  const memory = charts.find((chart) => chart.metricKey === 'gpu_memory_used');
  assert.deepEqual(memory.measures, [
    'modelMonitoring.usedMemory',
    'modelMonitoring.totalMemory'
  ]);
  assert.deepEqual(memory.neutralMeasures, ['modelMonitoring.totalMemory']);
  assert.equal(memory.metric.series.length, 6);
  assert.ok(memory.metric.series[0].name.endsWith('worker / GPU 0'));
  assert.ok(memory.metric.series[1].name.endsWith('worker / GPU 1'));
  assert.ok(
    memory.metric.series[3].name.startsWith('modelMonitoring.totalMemory')
  );
  assert.deepEqual(memory.metric.series[0].points, [[100, 1]]);
  assert.deepEqual(memory.metric.series[3].points, [[100, 10]]);
  assert.equal(JSON.stringify(data), source);
});

test('CPU-only Router Worker remains visible in host charts when there is no GPU inventory', () => {
  prepare();
  const data = context.resources.data;
  data.devices = [];
  data.workers = [{ id: 2, name: 'router-worker' }];
  data.all_devices = true;
  data.selected_device_id = null;
  data.metrics.host_cpu = {
    kind: 'gauge',
    unit: 'percent',
    status: 'available',
    reason: null,
    measurement_scope: 'worker',
    supported_statistics: ['current'],
    series: [
      {
        name: 'host_cpu',
        statistic: 'current',
        dimensions: { worker_id: 2 },
        points: [[100, 0]]
      }
    ],
    summaries: []
  };
  renderToStaticMarkup(createElement(HardwareContent, { host: true }));
  assert.equal(selects.length, 0);
  assert.equal(charts[0].metric.series[0].name, 'router-worker');
  assert.equal(charts[0].metric.series[0].dimensions.worker_id, 2);
  assert.deepEqual(charts[0].metric.series[0].points, [[100, 0]]);
});

test('device drawer restricts all-device history to the clicked opaque identity', () => {
  prepare();
  const data = context.resources.data;
  data.selected_device_id = null;
  data.all_devices = true;
  const lines = data.devices.map((device: any, index: number) => ({
    name: 'gpu_utilization',
    statistic: 'current',
    dimensions: { device_id: device.id, worker_id: device.worker_id },
    points: [[100, index]]
  }));
  data.metrics.gpu_utilization = {
    kind: 'gauge',
    unit: 'percent',
    status: 'available',
    reason: null,
    measurement_scope: 'physical_gpu',
    supported_statistics: ['current'],
    series: lines,
    summaries: lines.map((line: any, index: number) => ({
      statistic: 'current',
      dimensions: line.dimensions,
      value: index
    }))
  };
  renderToStaticMarkup(
    createElement(DeviceDrawer, { deviceId: 'gpu-a', onClose() {} })
  );
  assert.equal(charts.length, 1);
  assert.equal(charts[0].metric.series.length, 1);
  assert.equal(charts[0].metric.series[0].dimensions.device_id, 'gpu-a');
  assert.equal(charts[0].metric.summaries[0].value, 0);
  assert.equal(charts[0].metric.status, 'available');
});
