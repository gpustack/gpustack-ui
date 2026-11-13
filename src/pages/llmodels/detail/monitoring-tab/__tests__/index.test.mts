import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const antd = await import('antd');
const Spin = antd.Spin;
let context: any;
const tables: any[] = [],
  charts: any[] = [];
const passthrough = ({ children }: any) =>
  createElement(Fragment, null, children);
mock.module('@gpustack/core-ui', {
  namedExports: {
    SectionTitle: passthrough,
    CardWrapper: passthrough,
    GSDrawer: () => null,
    Table: (props: any) => {
      tables.push(props);
      return createElement(
        Spin,
        { spinning: props.loading },
        createElement('div', null, 'member rows')
      );
    }
  }
});
mock.module('antd', {
  namedExports: {
    Alert: antd.Alert,
    Button: antd.Button,
    Col: antd.Col,
    Flex: antd.Flex,
    Row: antd.Row,
    Modal: () => null,
    Tooltip: antd.Tooltip,
    Segmented: antd.Segmented,
    Select: antd.Select,
    Space: antd.Space,
    Typography: antd.Typography,
    Empty: antd.Empty,
    Spin,
    Collapse: ({ items }: any) =>
      createElement(
        Fragment,
        null,
        items.map((item: any) =>
          createElement(Fragment, { key: item.key }, item.children)
        )
      )
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module(
  new URL('../components/section-navigation.module.less', import.meta.url).href,
  { defaultExport: {} }
);
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: { isPDModel: (model: any) => !!model.roles?.length }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => context }
});
mock.module(
  new URL('../../components/metric-chart.tsx', import.meta.url).href,
  {
    defaultExport: (props: any) => {
      charts.push(props);
      return null;
    }
  }
);
mock.module(
  new URL('../../components/performance-stats.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../components/scope-toolbar.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
const { default: MonitoringTab } = await import('../index');
const { default: GPUResourcesTab } = await import('../../gpu-resources-tab');
const metric = (unit: string, role = 'decode') => ({
  kind: 'gauge',
  unit,
  status: 'available',
  reason: null,
  measurement_scope: 'engine',
  summaries: [],
  supported_statistics: ['current'],
  series: [
    {
      name: 'Deployment',
      statistic: 'current',
      dimensions: { role },
      points: [[100, 1]]
    }
  ]
});
const prepare = (loading = false) => {
  tables.length = 0;
  charts.length = 0;
  context = {
    model: {
      data: {
        roles: [
          { name: 'prefill', replicas: 1 },
          { name: 'decode', replicas: 1 }
        ],
        role_status: {}
      }
    },
    runtime: {
      loading,
      data: {
        available: true,
        metrics: {
          input_tokens: metric('tokens_per_second', 'prefill'),
          output_tokens: metric('tokens_per_second'),
          running_requests: metric('requests'),
          waiting_requests: metric('requests'),
          router_health: {
            ...metric('state'),
            summaries: [
              {
                statistic: 'current',
                dimensions: { upstream_instance_id: 7 },
                value: 1
              }
            ]
          }
        }
      }
    },
    resources: {
      loading,
      data: {
        available: true,
        allocated_gpu_count: 0,
        allocated_worker_count: 0,
        devices: [],
        metrics: {},
        selected_device_id: null
      }
    },
    instances: { data: [] },
    scope: {
      window: '1h',
      instanceIds: [],
      role: 'all',
      view: 'aggregate',
      latencyMetric: 'tpot'
    },
    changeScope() {},
    setTab() {},
    openMonitoringSection() {},
    tab: 'monitoring'
  };
};
test('PD member table forwards a boolean loading state and the actual Spin stops after completion', () => {
  prepare(false);
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  const memberTables = tables.filter((table) =>
    table.columns.some((column: any) => column.dataIndex === 'instance')
  );
  assert.equal(memberTables.length, 1);
  assert.equal(memberTables[0].loading, false);
  assert.ok(!html.includes('ant-spin-spinning'));
  prepare(true);
  renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(
    tables.find((table) =>
      table.columns.some((column: any) => column.dataIndex === 'instance')
    ).loading,
    true
  );
});
test('actual monitoring comparisons pass stable measure labels matching their combined series', () => {
  prepare(false);
  renderToStaticMarkup(createElement(MonitoringTab));
  for (const [key, measures] of [
    [
      'tokens',
      [
        'modelMonitoring.metric.input_tokens',
        'modelMonitoring.metric.output_tokens',
        'modelMonitoring.metric.total_tokens'
      ]
    ],
    [
      'requests',
      [
        'modelMonitoring.metric.running_requests',
        'modelMonitoring.metric.waiting_requests'
      ]
    ]
  ] as const) {
    const chart = charts.find((entry) => entry.metricKey === key);
    assert.deepEqual(chart.measures, [...measures]);
    assert.ok(chart.metric.series[0].name.startsWith(measures[0] + ' · '));
    assert.ok(chart.metric.series[1].name.startsWith(measures[1] + ' · '));
    if (key === 'tokens') {
      assert.ok(chart.metric.series[2].name.startsWith(measures[2] + ' · '));
      assert.deepEqual(chart.metric.series[2].points, [[100, 2]]);
    }
  }
});
test('latency descriptions no longer occupy a toolbar and no statistic filter returns', () => {
  prepare(false);
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  assert.ok(!html.includes('Avg / P50 / P95 / P99'));
  assert.ok(!html.includes('modelMonitoring.intervalVsTrend'));
  assert.ok(!html.includes('aria-label="modelMonitoring.trendStatistic"'));
});

test('GPU resource inventory also stops its actual Spin when its request finishes', () => {
  prepare(false);
  const html = renderToStaticMarkup(createElement(GPUResourcesTab));
  assert.equal(tables[0].loading, false);
  assert.ok(!html.includes('ant-spin-spinning'));
});

test('instance comparison shows output throughput and waiting requests while retaining summary populations', () => {
  prepare(false);
  context.scope.view = 'instances';
  const metrics = context.runtime.data.metrics;
  const summaries = JSON.stringify(metrics);
  renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(
    charts.find((chart) => chart.metricKey === 'tokens').metric,
    metrics.output_tokens
  );
  assert.deepEqual(
    charts.find((chart) => chart.metricKey === 'tokens').measures,
    []
  );
  assert.equal(
    charts.find((chart) => chart.metricKey === 'requests').metric.series.length,
    1
  );
  assert.equal(
    JSON.stringify(metrics),
    summaries,
    'view changes must not rewrite the pooled KPI/summary population'
  );
});

test('generation metric selector belongs to its chart card and changes only the displayed metric', () => {
  prepare(false);
  const patches: any[] = [];
  context.changeScope = (patch: any) => patches.push(patch);
  renderToStaticMarkup(createElement(MonitoringTab));
  const chart = charts.find((entry) => entry.metricKey === 'tpot');
  assert.ok(chart.extra, 'the generation chart must own its metric selector');
  assert.equal(
    chart.extra.props['aria-label'],
    'modelMonitoring.generationView'
  );
  chart.extra.props.onChange('itl');
  assert.deepEqual(patches, [{ latencyMetric: 'itl' }]);
});

test('Router health labels resolve the upstream members rather than repeat the observing Router name', () => {
  prepare(false);
  context.instances.data = [
    { id: 7, name: 'model-prefill', role: 'prefill' },
    { id: 8, name: 'model-decode', role: 'decode' },
    { id: 9, name: 'model-router', role: 'router' }
  ];
  context.runtime.data.metrics.router_health.summaries = [7, 8].map((id) => ({
    statistic: 'current',
    dimensions: {
      upstream_instance_id: id,
      model_instance_id: 9,
      model_instance_name: 'model-router',
      role: 'router'
    },
    value: 1
  }));
  renderToStaticMarkup(createElement(MonitoringTab));
  const members = tables.find((table) =>
    table.columns.some((column: any) => column.dataIndex === 'instance')
  ).dataSource;
  assert.deepEqual(
    members.map((row: any) => [row.instance, row.role, row.observer]),
    [
      ['model-prefill', 'prefill', 'model-router'],
      ['model-decode', 'decode', 'model-router']
    ]
  );
});
