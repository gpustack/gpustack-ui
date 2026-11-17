import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const antd = await import('antd');
let context: any;
let pdProps: any;
const popovers: any[] = [];
const tables: any[] = [],
  charts: any[] = [];
const passthrough = ({ children }: any) =>
  createElement(Fragment, null, children);
mock.module('@gpustack/core-ui', {
  namedExports: {
    SectionTitle: passthrough,
    CardWrapper: passthrough,
    TextAttribute: passthrough,
    GSDrawer: () => null,
    Table: (props: any) => {
      tables.push(props);
      return createElement(
        antd.Spin,
        { spinning: props.loading },
        createElement('div', null, 'rows')
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
    Popover: (props: any) => {
      popovers.push(props);
      return props.children;
    },
    Segmented: antd.Segmented,
    Select: antd.Select,
    Space: antd.Space,
    Typography: antd.Typography,
    Empty: antd.Empty,
    Spin: antd.Spin,
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
mock.module(
  new URL('../components/pd-monitoring.module.less', import.meta.url).href,
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
  { defaultExport: ({ extra }: any) => extra || null }
);
mock.module(
  new URL('../../components/pd-role-overview.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../components/pd-monitoring-content.tsx', import.meta.url).href,
  {
    defaultExport: (props: any) => {
      pdProps = props;
      return createElement('div', { 'data-pd-content': true });
    }
  }
);
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
const { default: MonitoringTab } = await import('../index');
const { default: GPUResourcesTab } = await import('../../gpu-resources-tab');
const metric = (unit: string, role = '') => ({
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
      dimensions: role ? { role } : {},
      points: [[100, 1]]
    }
  ]
});
const prepare = (pd = false) => {
  popovers.length = 0;
  tables.length = 0;
  charts.length = 0;
  pdProps = undefined;
  context = {
    model: {
      data: {
        roles: pd
          ? [
              { name: 'prefill', replicas: 1 },
              { name: 'decode', replicas: 1 }
            ]
          : [],
        role_status: {},
        backend: 'vllm',
        disaggregation: pd ? { mode: 'vllm-nixl' } : null
      }
    },
    runtime: {
      loading: false,
      data: {
        available: true,
        rate_window_seconds: 75,
        metrics: {
          input_tokens: metric('tokens_per_second', pd ? 'prefill' : ''),
          output_tokens: metric('tokens_per_second', pd ? 'decode' : ''),
          running_requests: metric('requests', pd ? 'decode' : ''),
          waiting_requests: metric('requests', pd ? 'decode' : '')
        }
      }
    },
    resources: {
      loading: false,
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

test('ordinary monitoring comparisons retain input, output, total and both request measures', () => {
  prepare();
  renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(pdProps, undefined);
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
  ]) {
    const chart = charts.find((entry) => entry.metricKey === key);
    assert.deepEqual(chart.measures, measures);
    assert.ok(chart.metric.series[0].name.startsWith(measures[0] + ' · '));
    assert.ok(chart.metric.series[1].name.startsWith(measures[1] + ' · '));
    if (key === 'tokens')
      assert.deepEqual(chart.metric.series[2].points, [[100, 2]]);
  }
});

test('a shared resource request failure is shown once per GPU group and remains on the standalone inventory', async () => {
  const { JSDOM } = await import('jsdom');
  prepare();
  context.resources.error = { response: { status: 500 } };
  const monitor = new JSDOM(renderToStaticMarkup(createElement(MonitoringTab)));
  const gpu = monitor.window.document.querySelector(
    '[data-monitoring-section="gpu"]'
  );
  assert.ok(gpu);
  assert.equal(
    (gpu.textContent?.match(/modelMonitoring.requestError/g) || []).length,
    1
  );
  const inventory = renderToStaticMarkup(createElement(GPUResourcesTab));
  assert.equal(
    (inventory.match(/modelMonitoring.requestError/g) || []).length,
    1
  );
  monitor.window.close();
});

test('ordinary instance comparison retains Running and Waiting without rewriting summaries', () => {
  prepare();
  context.scope.view = 'instances';
  const metrics = context.runtime.data.metrics;
  const before = JSON.stringify(metrics);
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
    2
  );
  assert.equal(JSON.stringify(metrics), before);
});

test('ordinary TTFT, TPOT and ITL are independent core charts without a generation selector', () => {
  prepare();
  const patches: any[] = [];
  context.changeScope = (patch: any) => patches.push(patch);
  const metrics = context.runtime.data.metrics;
  for (const [index, key] of ['ttft', 'tpot', 'itl'].entries()) {
    metrics[key] = {
      ...metric('seconds'),
      kind: 'histogram',
      series: [
        {
          name: key,
          statistic: 'p99',
          dimensions: {},
          points: [[100, index + 1]]
        }
      ]
    };
  }
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  for (const key of ['ttft', 'tpot', 'itl']) {
    const matching = charts.filter((entry) => entry.metricKey === key);
    assert.equal(matching.length, 1);
    assert.equal(matching[0].metric, metrics[key]);
    assert.equal(matching[0].extra, undefined);
  }
  assert.deepEqual(
    charts.slice(0, 3).map((chart) => chart.metricKey),
    ['ttft', 'tpot', 'itl']
  );
  assert.ok(!html.includes('modelMonitoring.generationView'));
  assert.deepEqual(patches, []);
});

test('PD monitoring delegates the complete role population, connector, and selected view to the shared panel', () => {
  prepare(true);
  context.scope = {
    ...context.scope,
    view: 'instances',
    role: 'prefill',
    instanceIds: [1]
  };
  context.instances.data = [
    { id: 1, name: 'prefill-a', role: 'prefill' },
    { id: 2, name: 'decode-a', role: 'decode' }
  ];
  const metrics = context.runtime.data.metrics;
  const before = JSON.stringify(metrics);
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  assert.ok(html.includes('data-pd-model-monitoring'));
  assert.equal(pdProps.metrics, metrics);
  assert.deepEqual(
    pdProps.instances.map((instance: any) => instance.id),
    [1, 2]
  );
  assert.equal(pdProps.focusedInstanceId, undefined);
  assert.equal(pdProps.onFocusChange, undefined);
  assert.equal(pdProps.view, 'instances');
  assert.equal(pdProps.backend, 'vllm');
  assert.equal(pdProps.mode, 'vllm-nixl');
  assert.equal(pdProps.showViewControl, false);
  assert.deepEqual(pdProps.sectionIds, {
    service: 'model-monitor-service',
    pools: 'model-monitor-pools',
    handoff: 'model-monitor-pd'
  });
  assert.equal(JSON.stringify(metrics), before);
  assert.equal(
    charts.some((chart) => chart.metricKey === 'ttft'),
    false,
    'the legacy Decode-local TTFT card cannot appear above the role pools'
  );
});

test('shared PD charts inherit source help, fixed card controls and rolling-window context', () => {
  prepare(true);
  renderToStaticMarkup(createElement(MonitoringTab));
  const spec = {
    key: 'prefill-phase',
    metricKey: 'prefill',
    title: 'Prefill',
    metric: metric('seconds', 'prefill'),
    help: 'first schedule to local token',
    measures: ['Avg'],
    extra: createElement('button')
  };
  const chart = pdProps.renderChart(spec);
  assert.equal(chart.props.metric, spec.metric);
  assert.equal(chart.props.note, spec.help);
  assert.equal(chart.props.extra, spec.extra);
  assert.equal(chart.props.focus, undefined);
  assert.equal(chart.props.showSummary, false);
  assert.equal(chart.props.rateWindowSeconds, 75);
});

test('PD instance view keeps every associated GPU and Worker without a hidden instance focus', () => {
  prepare(true);
  context.scope.instanceIds = [1];
  context.scope.view = 'instances';
  context.instances.data = [
    { id: 1, name: 'prefill-a', role: 'prefill', worker_id: 10 }
  ];
  context.resources.data.devices = [
    {
      id: '10:0',
      index: 0,
      worker_id: 10,
      worker_name: 'worker-a',
      model_instance_ids: [1]
    }
  ];
  renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(
    charts.find((chart) => chart.metricKey === 'gpu_utilization').focus,
    undefined
  );
  assert.equal(
    charts.find((chart) => chart.metricKey === 'host_cpu').focus,
    undefined
  );
  assert.equal(pdProps.metrics, context.runtime.data.metrics);
});

test('GPU resource inventory stops its Spin after the request completes', () => {
  prepare();
  const html = renderToStaticMarkup(createElement(GPUResourcesTab));
  assert.equal(tables[0].loading, false);
  assert.ok(!html.includes('ant-spin-spinning'));
});

test('PD aggregate view cannot retain an invisible instance focus from another tab', () => {
  prepare(true);
  context.scope.instanceIds = [1];
  context.instances.data = [
    { id: 1, name: 'prefill-a', role: 'prefill', worker_id: 10 }
  ];
  renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(pdProps.focusedInstanceId, undefined);
  assert.equal(
    charts.find((chart) => chart.metricKey === 'gpu_utilization').focus,
    undefined
  );
});

test('initial PD runtime loading never fabricates unsupported metric cards', () => {
  prepare(true);
  context.runtime = { loading: true, data: null, stale: false, error: null };
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(pdProps, undefined);
  assert.ok(html.includes('ant-spin-spinning'));
  assert.ok(!html.includes('data-pd-content'));
});

test('a failed PD runtime request shows the query error without fabricating backend capabilities', () => {
  prepare(true);
  context.runtime = {
    loading: false,
    data: null,
    stale: false,
    error: { response: { status: 500 } }
  };
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(pdProps, undefined);
  assert.ok(html.includes('modelMonitoring.requestError'));
  assert.ok(!html.includes('data-pd-content'));
});

test('same-scope retained PD data remains visible with its stale warning', () => {
  prepare(true);
  context.runtime.stale = true;
  context.runtime.error = { response: { status: 500 } };
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(pdProps.metrics, context.runtime.data.metrics);
  assert.ok(html.includes('modelMonitoring.stale'));
});

const absent = (
  status = 'unsupported',
  reason: string | null = 'metric_not_provided'
) => ({
  ...metric('requests'),
  status,
  reason,
  series: [],
  summaries: []
});

test('ordinary deployment omits unavailable groups and cards, including hardware, but retains observed zeros and errors', () => {
  prepare();
  Object.assign(context.runtime.data.metrics, {
    ttft: absent('no_data', 'no_samples'),
    tpot: absent(),
    itl: metric('seconds'),
    e2e: absent('query_error', 'query_failed'),
    queue: absent('restricted', 'resource_not_visible'),
    prefill: {
      ...metric('seconds'),
      series: [{ ...metric('seconds').series[0], points: [[100, 0]] }]
    },
    kv_usage: absent(),
    prefix_cache_hit_rate: absent(),
    external_cache_hit_rate: absent('not_applicable')
  });
  Object.assign(
    context.resources.data.metrics,
    Object.fromEntries(
      [
        'gpu_utilization',
        'gpu_memory_used',
        'gpu_memory_total',
        'gpu_power',
        'gpu_temperature'
      ].map((key) => [key, absent()])
    )
  );
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  assert.doesNotMatch(
    html,
    /aria-controls="model-monitor-cache"|aria-controls="model-monitor-gpu"/
  );
  assert.ok(
    !charts.some(
      (chart) =>
        chart.metricKey === 'tpot' || chart.metricKey === 'gpu_utilization'
    )
  );
  assert.ok(charts.some((chart) => chart.metricKey === 'itl'));
  assert.ok(charts.find((chart) => chart.metricKey === 'ttft').compactEmpty);
  assert.equal(
    charts.find((chart) => chart.metricKey === 'e2e').compactEmpty,
    false
  );
  assert.ok(charts.find((chart) => chart.metricKey === 'queue'));
  assert.ok(
    charts.find((chart) => chart.metricKey === 'prefill').metric.series[0]
      .points[0][1] === 0
  );
  assert.ok(popovers.some((props) => props['data-observation-notes']));
});

test('PD deployment adopts the same omission policy and navigation as Benchmark without claiming a direct Benchmark request path', () => {
  prepare(true);
  Object.assign(context.runtime.data.metrics, {
    ingress_ttft: absent(),
    ingress_e2e: absent(),
    router_health: absent()
  });
  const html = renderToStaticMarkup(createElement(MonitoringTab));
  assert.equal(pdProps.omitUnavailable, true);
  assert.doesNotMatch(html, /aria-controls="model-monitor-service"/);
  const notes = popovers.find((props) => props['data-observation-notes']);
  assert.ok(notes);
  const content = renderToStaticMarkup(notes.content);
  assert.doesNotMatch(
    content,
    /benchmark.monitoring.direct|bypasses the GPUStack gateway/
  );
  assert.match(content, /modelMonitoring.pd.ingressUnavailable/);
  const chart = pdProps.renderChart({
    key: 'empty',
    metricKey: 'tpot',
    title: 'TPOT',
    metric: absent('no_observations', 'zero_observations')
  });
  assert.equal(chart.props.compactEmpty, true);
});
