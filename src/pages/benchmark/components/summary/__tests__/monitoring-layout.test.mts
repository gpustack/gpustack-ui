import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, forwardRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import benchmarkMessages from '../../../../../locales/en-US/benchmark';
import modelMessages from '../../../../../locales/en-US/model-monitoring';

const translations = {
  ...((benchmarkMessages as any).default ?? benchmarkMessages),
  ...((modelMessages as any).default ?? modelMessages)
};
const element = ({ children, title, className }: any) =>
  createElement('div', { className }, title, children);
const chartProps: any[] = [];
const tableProps: any[] = [];
const selectProps: any[] = [];
const collapseProps: any[] = [];
const popoverProps: any[] = [];
const navigateSection = mock.fn((_id: string) => () => {});
mock.module(
  new URL(
    '../../../../_components/monitoring/monitoring-navigation.module.less',
    import.meta.url
  ).href,
  {
    defaultExport: { navigation: 'monitoring-navigation' }
  }
);
mock.module(
  new URL(
    '../../../../llmodels/detail/utils/section-navigation.ts',
    import.meta.url
  ).href,
  {
    namedExports: { scrollWhenSectionSettles: navigateSection }
  }
);
const helpProps: any[] = [];
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => translations[id] || id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: element,
    SectionTitle: element,
    StatusDot: ({ statusValue }: any) =>
      createElement(
        'span',
        { 'data-status': statusValue?.status },
        statusValue?.text
      ),
    TextAttribute: element,
    SimpleSelect: ({ mode, value, options }: any) =>
      createElement(
        'select',
        { multiple: mode === 'multiple', defaultValue: value },
        options.map((option: any) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      ),
    Table: (props: any) => {
      tableProps.push(props);
      return element(props);
    }
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('antd', {
  namedExports: {
    Button: forwardRef(
      ({ children, onClick, disabled, ...rest }: any, ref: any) =>
        createElement(
          'button',
          {
            onClick,
            onKeyDown: rest.onKeyDown,
            ref,
            disabled,
            'aria-pressed': rest['aria-pressed'],
            'aria-label': rest['aria-label'],
            className: rest.className,
            style: rest.style
          },
          children
        )
    ),
    Flex: element,
    Space: element,
    Row: element,
    Col: element,
    Typography: { Text: element, Title: element },
    Tooltip: ({ children }: any) => children,
    Segmented: () => null,
    Select: (props: any) => {
      selectProps.push(props);
      return null;
    },
    Popover: (props: any) => {
      popoverProps.push(props);
      return props.children;
    },
    Alert: ({ title }: any) => createElement('div', { role: 'alert' }, title),
    Collapse: (props: any) => {
      collapseProps.push(props);
      const { items } = props;
      return createElement(
        'div',
        null,
        items.map((item: any) =>
          createElement(
            'section',
            { key: item.key, 'data-section': item.key },
            item.label,
            item.children
          )
        )
      );
    }
  }
});
mock.module(
  new URL(
    '../../../../llmodels/detail/components/metric-chart.tsx',
    import.meta.url
  ).href,
  {
    defaultExport: (props: any) => {
      chartProps.push(props);
      return createElement(
        'article',
        { 'data-metric': props.metricKey },
        props.title,
        props.extra
      );
    }
  }
);
mock.module(
  new URL(
    '../../../../llmodels/detail/components/help-tooltip.tsx',
    import.meta.url
  ).href,
  {
    defaultExport: (props: any) => {
      helpProps.push(props);
      return createElement('button', { 'aria-label': props.label });
    }
  }
);
mock.module(
  new URL(
    '../../../../llmodels/detail/components/hardware-content.tsx',
    import.meta.url
  ).href,
  {
    namedExports: {
      combineMetrics: (entries: any[]) => {
        const metrics = entries.filter((entry) => entry[1]);
        return metrics.length
          ? {
              ...metrics[0][1],
              series: metrics.flatMap(([name, metric]) =>
                metric.series.map((series: any) => ({
                  ...series,
                  name: `${name} · ${series.name}`
                }))
              ),
              summaries: metrics.flatMap(([, metric]) => metric.summaries)
            }
          : undefined;
      }
    }
  }
);
mock.module(
  new URL(
    '../../../../llmodels/detail/components/hardware-metrics.ts',
    import.meta.url
  ).href,
  { namedExports: { labelHardwareMetric: (metric: any) => metric } }
);
mock.module(
  new URL(
    '../../../../llmodels/detail/components/metric-state.tsx',
    import.meta.url
  ).href,
  { namedExports: { MetricNotice: () => null, MetricState: () => null } }
);
let detail: any = {
  load_type: 'concurrency',
  slo_p99_ttft_ms: 600,
  slo_p99_tpot_ms: 6
};
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  { namedExports: { useDetailContext: () => ({ detailData: detail }) } }
);
mock.module(
  new URL(
    '../../../../llmodels/detail/monitoring-tab/components/section-navigation.module.less',
    import.meta.url
  ).href,
  { defaultExport: {} }
);
mock.module(
  new URL(
    '../../../../llmodels/detail/monitoring-tab/components/monitoring-section-card.tsx',
    import.meta.url
  ).href,
  {
    defaultExport: (props: any) => {
      collapseProps.push({
        activeKey: props.expanded ? [props.sectionKey] : [],
        onChange: (keys: string[]) => props.onToggle(keys.length > 0),
        items: [
          {
            key: props.sectionKey,
            label: props.title,
            children: props.children
          }
        ]
      });
      return createElement(
        'section',
        { 'data-section': props.sectionKey, id: props.id },
        props.title,
        props.annotation,
        props.extra,
        props.children
      );
    }
  }
);
const { default: MonitoringCharts } = await import('../monitoring-charts');
mock.module(new URL('../point-navigation.module.less', import.meta.url).href, {
  defaultExport: {}
});
const { default: StageTimeline } = await import('../stage-timeline');
const metric = (name: string, roles: string[] = ['inference']) => ({
  kind: 'gauge',
  unit: 'requests',
  status: 'available',
  reason: null,
  supported_statistics: ['current'],
  measurement_scope: 'instance',
  series: roles.map((role, index) => ({
    name: `${name} ${role}`,
    statistic: 'current',
    dimensions: { role, model_instance_id: index + 1 },
    points: [
      [100, 0],
      [120, 2]
    ]
  })),
  summaries: []
});
const data = (pd = false) =>
  ({
    context: {
      available: true,
      run_window: { start: 100, end: 400 },
      stages: [],
      instances: (pd
        ? ['prefill', 'decode', 'router']
        : ['inference', 'inference']
      ).map((role, index) => ({
        id: index + 1,
        name: `instance-${index}`,
        role,
        worker_id: index + 1,
        worker_ids: [index + 1]
      })),
      devices: [],
      workers: []
    },
    runtime: {
      rate_window_seconds: 60,
      metrics: Object.fromEntries(
        [
          'ttft',
          'tpot',
          'itl',
          'e2e',
          'queue',
          'prefill',
          'decode',
          'input_tokens',
          'output_tokens',
          'running_requests',
          'waiting_requests',
          'kv_usage',
          'prefix_cache_hit_rate',
          'external_cache_hit_rate'
        ].map((key) => [
          key,
          metric(key, pd ? ['prefill', 'decode'] : ['inference'])
        ])
      )
    },
    resources: { metrics: {}, devices: [], workers: [] },
    instances: {
      metrics: {
        output_tokens: metric('output_tokens', pd ? ['decode'] : ['inference']),
        running_requests: metric(
          'running_requests',
          pd ? ['prefill', 'decode'] : ['inference']
        ),
        waiting_requests: metric(
          'waiting_requests',
          pd ? ['prefill', 'decode'] : ['inference']
        )
      }
    },
    loading: false,
    errors: {},
    window: { start: 100, end: 400 }
  }) as any;

test('associated Worker and GPU drilldowns retain exact selected phase boundaries, including sub-second phases', async () => {
  const { JSDOM } = await import('jsdom');
  const source = data(true);
  source.context.resource_status = 'available';
  source.context.workers = source.resources.workers = [
    { id: 1, name: 'worker-a' }
  ];
  source.context.devices = source.resources.devices = [
    {
      id: 'stable-gpu-a',
      index: 0,
      worker_id: 1,
      worker_name: 'worker-a',
      model_instance_ids: [1],
      reason: null
    }
  ];
  const range = { start: 1730000000.123, end: 1730000000.124 };
  popoverProps.length = 0;
  renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range,
      bands: [],
      view: 'aggregate',
      onViewChange() {}
    })
  );
  const panel = popoverProps.find(
    (props) =>
      props.content && renderToStaticMarkup(props.content).includes('worker-a')
  );
  assert.ok(panel, 'resource associations remain reachable');
  assert.equal(
    panel.trigger,
    'click',
    'interactive links stay open while focus moves into the panel'
  );
  assert.equal(panel.content.props.role, 'region');
  assert.equal(typeof panel.content.props.onKeyDown, 'function');
  const dom = new JSDOM(renderToStaticMarkup(panel.content));
  const links = [...dom.window.document.querySelectorAll('a')];
  assert.equal(links.length, 2);
  for (const link of links) {
    const url = link.getAttribute('href')!;
    const params = new URLSearchParams(url.split('?')[1]);
    assert.equal(params.get('start'), String(range.start));
    assert.equal(params.get('end'), String(range.end));
    assert.equal(params.get('tab'), 'monitoring');
    assert.equal(params.has('window'), false);
  }
  assert.ok(
    links.some((link) =>
      link.getAttribute('href')!.includes('device_id=stable-gpu-a')
    )
  );
  dom.window.close();
  source.context.resource_status = 'restricted';
  popoverProps.length = 0;
  renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range,
      bands: [],
      view: 'aggregate',
      onViewChange() {}
    })
  );
  const restricted = popoverProps.find(
    (props) =>
      props.content && renderToStaticMarkup(props.content).includes('worker-a')
  );
  assert.ok(restricted);
  assert.ok(
    !renderToStaticMarkup(restricted.content).includes('<a'),
    'known inaccessible resources cannot be active links'
  );
});

test('saved hardware observations remain visible without linking deleted current resources', () => {
  const source = data(true);
  source.context.observation_storage = {
    source: 'archive',
    run_id: 'saved',
    content_version: 'saved-1'
  };
  source.context.workers = source.resources.workers = [
    { id: 1, name: 'deleted-worker' }
  ];
  source.context.devices = source.resources.devices = [
    {
      id: 'saved-gpu',
      index: 0,
      worker_id: 1,
      worker_name: 'deleted-worker',
      model_instance_ids: [1],
      reason: null
    }
  ];
  popoverProps.length = 0;
  chartProps.length = 0;
  renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: { start: 100, end: 400 },
      bands: [],
      view: 'aggregate',
      onViewChange() {}
    })
  );
  const panel = popoverProps.find(
    (props) =>
      props.content &&
      renderToStaticMarkup(props.content).includes('deleted-worker')
  );
  assert.ok(panel);
  assert.ok(!renderToStaticMarkup(panel.content).includes('<a'));
  assert.ok(chartProps.some((props) => props.metricKey === 'gpu_utilization'));
});

test('standard monitoring removes duplicate instance charts while retaining both queues in the instance view', () => {
  chartProps.length = 0;
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: data(),
      range: { start: 100, end: 400 },
      bands: [],
      view: 'instances',
      onViewChange: () => {}
    })
  );
  assert.equal(chartProps.length, 18);
  for (const key of ['tpot', 'itl'])
    assert.equal(
      chartProps.filter((props) => props.metricKey === key).length,
      1
    );
  assert.ok(chartProps.every((props) => props.showSummary === false));
  assert.deepEqual(
    chartProps
      .find((props) => props.metricKey === 'requests')
      .metric.series.map((series: any) => series.name.split(' · ')[0]),
    ['Running requests', 'Waiting requests']
  );
  assert.equal(
    chartProps.some((props) =>
      ['instance-output', 'instance-requests'].includes(props.metricKey)
    ),
    false
  );
  assert.doesNotMatch(html, /data-section="instances"/);
  assert.doesNotMatch(html, />Instances<\/button>/);
  assert.equal(
    chartProps.some((props) => props.metricKey === 'pd-queues'),
    false
  );
});

test('PD replaces duplicate instance sections with separate Prefill and Decode pools and never substitutes local TTFT for ingress', () => {
  chartProps.length = 0;
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: data(true),
      range: { start: 100, end: 400 },
      bands: [],
      view: 'aggregate',
      onViewChange: () => {}
    })
  );
  assert.doesNotMatch(html, /data-section="instances"/);
  assert.match(html, /Service experience/);
  assert.ok(html.includes(translations['modelMonitoring.pd.rolePools']));
  assert.equal(
    chartProps.filter((props) => props.title === 'Service TTFT').length,
    0
  );
  for (const role of ['prefill', 'decode']) {
    const queue = chartProps.find(
      (props) =>
        props.metricKey === 'requests' &&
        props.title.startsWith(role === 'prefill' ? 'Prefill' : 'Decode')
    );
    assert.deepEqual(
      queue.metric.series.map((series: any) => series.dimensions.role),
      [role, role]
    );
  }
  assert.ok(
    chartProps
      .find(
        (props) =>
          props.metricKey === 'pd_request_timing' &&
          props.title.startsWith('Prefill')
      )
      .metric.series.every(
        (series: any) => series.dimensions.role === 'prefill'
      )
  );
  assert.ok(
    chartProps
      .find((props) => props.metricKey === 'tpot')
      .metric.series.every((series: any) => series.dimensions.role === 'decode')
  );
  assert.ok(chartProps.every((props) => props.showSummary === false));
});

test('point navigation keeps measured time in metadata while sorting by load', () => {
  const points = [0, 1].map((sequence) => ({
    id: sequence + 1,
    load: 8 * (sequence + 1),
    raw: { sequence, input_tokens: null, rate: 8 * (sequence + 1) },
    tps: 100,
    ttftP99: 700,
    tpotP99: 7,
    total: 1000,
    ok: 1000,
    lowSample: false,
    sloPass: false
  }));
  const response = data();
  response.context.stages = points.map((point, index) => ({
    sequence: point.raw.sequence,
    input_tokens: null,
    start: index ? 160 : 100,
    end: index ? 400 : 160
  }));
  const html = renderToStaticMarkup(
    createElement(StageTimeline, {
      points,
      selectedId: 1,
      onSelect: () => {},
      data: response
    } as any)
  );
  assert.doesNotMatch(html, /stage-time-tick/);
  assert.match(html, /Load comparison/);
  assert.match(html, /[0-9]{2}:[0-9]{2}:[0-9]{2}/);
  response.context.stages[0].start = null;
  const missing = renderToStaticMarkup(
    createElement(StageTimeline, {
      points,
      selectedId: 1,
      onSelect: () => {},
      data: response
    } as any)
  );
  assert.match(missing, /Exact stage timing is unavailable/);
  assert.doesNotMatch(missing, /width:50%/);
});

test('point navigation separates stage, load and verdict without a reordered time axis', async () => {
  const { JSDOM } = await import('jsdom');
  const source = data();
  const points = [0, 1, 2].map((sequence) => ({
    id: sequence + 1,
    load: 8 * (sequence + 1),
    raw: { sequence, input_tokens: null, rate: 8 * (sequence + 1) },
    sloPass: sequence !== 1,
    isPeak: sequence === 1,
    ttftP99: sequence === 1 ? 700 : 500,
    tpotP99: 5,
    lowSample: false
  }));
  source.context.stages = points.map((point, index) => ({
    sequence: point.raw.sequence,
    input_tokens: null,
    start: [100, 160, 250][index],
    end: [160, 250, 400][index]
  }));
  const html = renderToStaticMarkup(
    createElement(StageTimeline, {
      points,
      selectedId: 2,
      baselineId: 1,
      onSelect() {},
      data: source
    } as any)
  );
  const dom = new JSDOM(html);
  try {
    const buttons = [...dom.window.document.querySelectorAll('.stage-segment')];
    assert.equal(buttons.length, 3);
    assert.ok(
      buttons.every(
        (button) =>
          button.querySelector('.phase-segment-top') &&
          button.querySelector('.stage-load') &&
          button.querySelector('.stage-verdict')
      )
    );
    assert.match(
      buttons[1].querySelector('.phase-designation')!.textContent!,
      /Peak/
    );
    assert.match(buttons[0].textContent!, /Baseline/);
    assert.equal(
      dom.window.document.querySelectorAll('.stage-time-tick').length,
      0
    );
    assert.match(buttons[1].getAttribute('aria-label')!, /SLO breached/);
  } finally {
    dom.window.close();
  }
});

test('resource permission, partial sampling and failed query remain different notices', () => {
  const response = data();
  response.context.resource_status = 'restricted';
  assert.match(
    renderToStaticMarkup(
      createElement(MonitoringCharts, {
        data: response,
        range: null,
        bands: [],
        view: 'aggregate',
        onViewChange: () => {}
      })
    ),
    /Resource observations are restricted/
  );
  response.context.resource_status = 'available';
  response.runtime.metrics.ttft.coverage = { partial: true };
  assert.match(
    renderToStaticMarkup(
      createElement(MonitoringCharts, {
        data: response,
        range: null,
        bands: [],
        view: 'aggregate',
        onViewChange: () => {}
      })
    ),
    /Some monitoring samples are missing/
  );
  response.errors.runtime = new Error('query failed');
  assert.match(
    renderToStaticMarkup(
      createElement(MonitoringCharts, {
        data: response,
        range: null,
        bands: [],
        view: 'aggregate',
        onViewChange: () => {}
      })
    ),
    /Monitoring query failed/
  );
});

test('probe-only auto tune waits for measured load stages instead of showing an empty progress track', () => {
  const html = renderToStaticMarkup(
    createElement(StageTimeline, {
      points: [],
      onSelect: () => {},
      data: data()
    })
  );
  assert.match(html, /Waiting for measured load stages/);
  assert.doesNotMatch(html, /Stage 0/);
});

test('a throughput run uses actual stage time instead of repeating an unconfigured SLO on every segment', () => {
  detail = { load_type: 'fixed_rate', auto_tune: true };
  const point: any = {
    id: 1,
    load: 4,
    raw: { rate: 4, sequence: 0, input_tokens: null },
    sloPass: null
  };
  const source = data();
  source.context.stages = [
    { id: '0:0', sequence: 0, input_tokens: null, start: 100, end: 130 }
  ];
  const html = renderToStaticMarkup(
    createElement(StageTimeline, {
      points: [point],
      onSelect: () => {},
      data: source
    })
  );
  assert.doesNotMatch(html.replace(/<[^>]+>/g, ''), /SLO not configured/);
  assert.match(html, /[0-9]{2}:[0-9]{2}:[0-9]{2}/);
});

test('a different linked execution shows the run-change notice without old or empty monitoring charts', () => {
  chartProps.length = 0;
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: {
        context: null,
        runtime: null,
        instances: null,
        resources: null,
        errors: { context: { code: 'benchmark_run_changed' } },
        loading: false,
        window: null
      },
      range: null,
      bands: [],
      view: 'aggregate',
      onViewChange() {}
    } as any)
  );
  assert.match(html, /different Benchmark run/);
  assert.equal(chartProps.length, 0);
});

test('legacy reports explain the missing recorded associations instead of implying a failed monitoring query', () => {
  chartProps.length = 0;
  const source = data();
  source.context.available = false;
  source.context.reason = 'historical_association_unavailable';
  source.runtime = source.instances = source.resources = null;
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.context.run_window,
      bands: [],
      view: 'aggregate',
      onViewChange: () => {}
    })
  );
  assert.match(html, /Monitoring associations were not recorded for this run/);
  assert.doesNotMatch(html, /data-metric/);
  assert.doesNotMatch(html, /0 GPU|0 Worker/);
});

test('unobserved metrics stay named with a compact reason while real zero-valued samples remain charts', () => {
  chartProps.length = 0;
  const source = data();
  source.runtime.metrics.ttft = {
    ...metric('ttft'),
    status: 'no_data',
    reason: 'no_samples',
    series: []
  };
  source.runtime.metrics.running_requests.series[0].points = [[100, 0]];
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.window,
      bands: [],
      view: 'aggregate',
      onViewChange: () => {}
    })
  );
  assert.equal(
    chartProps.find((chart) => chart.metricKey === 'ttft').compactEmpty,
    true
  );
  assert.match(html, /Time to first token/);
  assert.equal(
    chartProps.find((chart) => chart.metricKey === 'ttft').metric.reason,
    'no_samples'
  );
  assert.equal(
    chartProps.some((chart) => chart.metricKey === 'requests'),
    true
  );
});

test('a metric query error retains its chart error state instead of being compacted as unobserved', () => {
  chartProps.length = 0;
  const source = data();
  source.runtime.metrics.ttft = {
    ...metric('ttft'),
    status: 'query_error',
    reason: 'query_failed',
    series: []
  };
  renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.window,
      bands: [],
      view: 'aggregate',
      onViewChange: () => {}
    })
  );
  assert.equal(
    chartProps.find((chart) => chart.metricKey === 'ttft').metric.status,
    'query_error'
  );
});

test('independent generation charts retain their own empty/available data without a shared metric selector', () => {
  selectProps.length = 0;
  chartProps.length = 0;
  const source = data();
  source.runtime.metrics.tpot = {
    ...metric('tpot'),
    status: 'no_data',
    reason: 'no_samples',
    series: []
  };
  renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.window,
      bands: [],
      view: 'aggregate',
      onViewChange: () => {}
    })
  );
  for (const key of ['ttft', 'tpot', 'itl']) {
    const found = chartProps.filter((props) => props.metricKey === key);
    assert.equal(found.length, 1);
    assert.equal(found[0].metric, source.runtime.metrics[key]);
    assert.equal(found[0].extra, undefined);
  }
  assert.equal(
    chartProps.find((props) => props.metricKey === 'tpot').metric.status,
    'no_data'
  );
  assert.equal(
    chartProps.find((props) => props.metricKey === 'itl').metric.status,
    'available'
  );
  assert.ok(
    !selectProps.some(
      (props) =>
        props['aria-label'] === translations['modelMonitoring.generationView']
    )
  );
});

test('SGLang PD handoff keeps its bootstrap meaning instead of relabeling it as full KV transfer latency', () => {
  chartProps.length = 0;
  const source = data(true);
  source.runtime.metrics.pd_kv_transfer = {
    ...metric('bootstrap'),
    measurement_scope: 'bootstrap_handshake'
  };
  source.runtime.metrics.pd_kv_completion = {
    ...metric('completion'),
    measurement_scope: 'kv_transfer_duration'
  };
  source.runtime.metrics.pd_kv_throughput = {
    ...metric('throughput'),
    kind: 'counter',
    unit: 'bytes_per_second'
  };
  renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.window,
      bands: [],
      view: 'aggregate',
      onViewChange: () => {}
    })
  );
  assert.ok(
    !chartProps.some((p) => p.metric === source.runtime.metrics.pd_kv_transfer)
  );
  assert.ok(!chartProps.some((p) => p.metricKey === 'pd_kv_transfer'));
  assert.ok(chartProps.some((p) => p.metricKey === 'pd_kv_completion'));
  assert.ok(chartProps.some((p) => p.metricKey === 'pd_kv_throughput'));
  assert.ok(
    !chartProps.some((p) =>
      [
        'pd_kv_transfer_post',
        'pd_kv_allocation',
        'pd_kv_transfer_speed'
      ].includes(p.metricKey)
    )
  );
});

test('PD Router observations resolve both recorded member identities and keep removed or unknown health explicit', () => {
  tableProps.length = 0;
  const source = data(true);
  source.runtime.metrics.router_health = {
    ...metric('health'),
    summaries: [
      {
        statistic: 'current',
        dimensions: { model_instance_id: 3, upstream_instance_id: 1 },
        value: -1
      }
    ]
  };
  renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.window,
      bands: [],
      view: 'aggregate',
      onViewChange: () => {}
    })
  );
  const table = tableProps.find((t) =>
    t.columns.some((c: any) => c.dataIndex === 'observer')
  );
  assert.equal(table.dataSource[0].instance, 'instance-0');
  assert.equal(table.dataSource[0].observer, 'instance-2');
  assert.equal(table.dataSource[0].role, 'prefill');
  assert.match(
    renderToStaticMarkup(
      table.columns.find((c: any) => c.dataIndex === 'value').render(-1)
    ),
    new RegExp(
      `data-status="inactive"[^>]*>${translations['modelMonitoring.removed']}`
    )
  );
});

test('PD engines without Router health observations do not render an empty membership table as though it were evidence', () => {
  tableProps.length = 0;
  const source = data(true);
  source.runtime.metrics.router_health = {
    ...metric('health'),
    status: 'unsupported',
    series: [],
    summaries: []
  };
  renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.window,
      bands: [],
      view: 'aggregate',
      onViewChange: () => {}
    })
  );
  assert.equal(
    tableProps.filter((t) =>
      t.columns.some((c: any) => c.dataIndex === 'observer')
    ).length,
    0
  );
});

test('updated monitoring populations have no cached instance selector or chart focus', async () => {
  const { JSDOM } = await import('jsdom');
  const { act } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const dom = new JSDOM('<div id="root"></div>');
  const keys = ['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  );
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true },
    document: { value: dom.window.document, configurable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
  });
  const root = createRoot(document.getElementById('root')!);
  const source = data(true);
  const render = (value: any) =>
    root.render(
      createElement(MonitoringCharts, {
        data: value,
        range: value.window,
        bands: [],
        view: 'instances',
        onViewChange: () => {}
      })
    );
  try {
    selectProps.length = 0;
    chartProps.length = 0;
    await act(async () => render(source));
    assert.ok(!selectProps.some((props) => props.allowClear));
    assert.ok(chartProps.every((props) => props.focus == null));
    const changed = {
      ...source,
      context: {
        ...source.context,
        instances: source.context.instances.filter((i: any) => i.id !== 1)
      }
    };
    for (const key of ['runtime', 'instances'])
      changed[key] = {
        ...source[key],
        metrics: Object.fromEntries(
          Object.entries(source[key].metrics).map(([name, metric]: any) => [
            name,
            {
              ...metric,
              series: metric.series.filter(
                (s: any) => s.dimensions.model_instance_id !== 1
              )
            }
          ])
        )
      };
    chartProps.length = 0;
    await act(async () => render(changed));
    assert.ok(!selectProps.some((props) => props.allowClear));
    assert.ok(
      chartProps.every((props) =>
        (props.metric?.series || []).every(
          (series: any) => series.dimensions.model_instance_id !== 1
        )
      )
    );
    assert.ok(chartProps.every((c) => c.focus == null));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const key of keys) {
      const descriptor = previous[key];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    }
  }
});

for (const pd of [false, true]) {
  test(`${pd ? 'PD' : 'standard'} monitoring passes the same load segments to every model, instance, GPU and Worker chart`, () => {
    chartProps.length = 0;
    const segments = [
      {
        id: 'phase-1',
        start: 100,
        end: 200,
        label: '4',
        caption: '#1',
        description: '4 concurrent requests'
      }
    ];
    renderToStaticMarkup(
      createElement(MonitoringCharts, {
        data: data(pd),
        range: { start: 100, end: 400 },
        bands: [],
        view: 'aggregate',
        onViewChange() {},
        timeSegments: segments,
        inspectionScope: 'load:1'
      })
    );
    assert.ok(chartProps.length >= 17);
    assert.ok(
      chartProps.every(
        (p) => p.timeSegments === segments && p.exactCursor === true
      )
    );
    assert.ok(chartProps.some((p) => p.metricKey === 'gpu_utilization'));
    assert.ok(chartProps.some((p) => p.metricKey === 'host_cpu'));
  });
}

test('PD role pools expose both queues without instance selectors or a duplicate instance group', () => {
  chartProps.length = 0;
  selectProps.length = 0;
  const response = data(true);
  response.instances.metrics.running_requests = metric('running_requests', [
    'prefill',
    'decode'
  ]);
  response.instances.metrics.waiting_requests = metric('waiting_requests', [
    'prefill',
    'decode'
  ]);
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: response,
      range: response.window,
      bands: [],
      view: 'instances',
      onViewChange() {}
    })
  );
  assert.doesNotMatch(html, /data-section="instances"/);
  const queues = chartProps.filter((p) => p.metricKey === 'requests');
  assert.deepEqual(
    queues.map((p) => p.metric.series.map((s: any) => s.dimensions.role)),
    [
      ['prefill', 'prefill'],
      ['decode', 'decode']
    ]
  );
  assert.deepEqual(
    selectProps
      .filter((p) => p.allowClear)
      .map((p) => p.options.map((o: any) => o.label)),
    []
  );
});

test('unavailable historical identities explain the association rather than claiming no samples', () => {
  for (const [reason, expected] of [
    ['model_instance_not_visible', 'unavailable or not visible'],
    ['model_not_visible', 'unavailable or not visible'],
    ['historical_association_changed', 'associations have changed']
  ] as const) {
    const response = data();
    response.context.available = false;
    response.context.reason = reason;
    response.runtime = null;
    response.instances = null;
    response.resources = null;
    const html = renderToStaticMarkup(
      createElement(MonitoringCharts, {
        data: response,
        range: null,
        bands: [],
        view: 'aggregate',
        onViewChange() {}
      })
    );
    assert.ok(html.includes(expected), html);
    assert.doesNotMatch(html, /No monitoring history for this interval/);
  }
});

test('a failed active instance request is a query failure rather than unsupported PD metrics', () => {
  const source = data(true);
  source.instances = null;
  source.errors.instances = new Error('query failed');
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.window,
      bands: [],
      view: 'instances',
      onViewChange() {}
    })
  );
  assert.ok(html.includes(translations['benchmark.monitoring.queryFailed']));
  assert.ok(
    !html.includes(translations['modelMonitoring.state.metric_not_provided'])
  );
});

test('the active instance response owns the rolling window and does not inherit an inactive aggregate failure', () => {
  chartProps.length = 0;
  const source = data(true);
  source.instances.rate_window_seconds = 90;
  source.errors.runtime = new Error('inactive aggregate query failed');
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: source,
      range: source.window,
      bands: [],
      view: 'instances',
      onViewChange() {}
    })
  );
  assert.ok(!html.includes(translations['benchmark.monitoring.queryFailed']));
  assert.ok(
    chartProps
      .filter((props) => props.metricKey === 'requests')
      .every((props) => props.rateWindowSeconds === 90)
  );
});

test('opening GPU observations preserves the expanded PD role and handoff sections', async () => {
  const { JSDOM } = await import('jsdom');
  const { act, createRef } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const dom = new JSDOM('<div id="root"></div>');
  const keys = ['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  );
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true },
    document: { value: dom.window.document, configurable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
  });
  const root = createRoot(document.getElementById('root')!);
  const chartsRef = createRef<any>();
  const latest = (key: string) =>
    collapseProps
      .filter((props) => props.items.some((item: any) => item.key === key))
      .at(-1);
  const source = data(true);
  const render = (next: any) =>
    root.render(
      createElement(MonitoringCharts, {
        ref: chartsRef,
        benchmarkId: 58,
        data: next,
        range: { start: 100, end: 400 },
        bands: [],
        view: 'aggregate',
        onViewChange() {}
      })
    );
  try {
    await act(async () =>
      root.render(
        createElement(MonitoringCharts, {
          ref: chartsRef,
          benchmarkId: 58,
          data: source,
          range: { start: 100, end: 400 },
          bands: [],
          view: 'aggregate',
          onViewChange() {}
        })
      )
    );
    assert.deepEqual(latest('pools').activeKey, ['pools']);
    assert.deepEqual(latest('pd').activeKey, []);
    await act(async () => chartsRef.current.openSection('stages'));
    assert.deepEqual(latest('pools').activeKey, ['pools']);
    assert.deepEqual(
      latest('role-details').activeKey,
      [],
      'stage timing links must not open cache observations'
    );
    assert.equal(
      navigateSection.mock.calls.at(-1)!.arguments[0],
      'benchmark-monitor-pools'
    );
    await act(async () => chartsRef.current.openSection('cache'));
    assert.deepEqual(latest('role-details').activeKey, ['role-details']);
    await act(async () => latest('pd').onChange(['pd']));
    await act(async () => latest('gpu').onChange(['gpu']));
    assert.deepEqual(latest('pools').activeKey, ['pools']);
    assert.deepEqual(latest('pd').activeKey, ['pd']);
    assert.deepEqual(latest('gpu').activeKey, ['gpu']);
    await act(async () =>
      render({
        ...source,
        context: null,
        runtime: null,
        instances: null,
        resources: null,
        loading: true
      })
    );
    await act(async () => render(source));
    assert.deepEqual(latest('pools').activeKey, ['pools']);
    assert.deepEqual(latest('pd').activeKey, ['pd']);
    assert.deepEqual(latest('gpu').activeKey, ['gpu']);
    assert.equal(latest('router'), undefined);
    const toggle = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Expand all"]'
    )!;
    assert.ok(toggle);
    assert.equal(
      document.querySelector('button[aria-label="Collapse all"]'),
      null
    );
    await act(async () => toggle.click());
    assert.equal(latest('router'), undefined);
    assert.equal(
      document.querySelector('button[aria-label="Collapse all"]'),
      toggle
    );
    await act(async () => toggle.click());
    for (const key of ['pools', 'service', 'pd', 'gpu', 'host'])
      assert.deepEqual(latest(key).activeKey, []);
    await act(async () => chartsRef.current.openSection('router'));
    assert.deepEqual(latest('pools').activeKey, ['pools']);
    assert.equal(
      navigateSection.mock.calls.at(-1)!.arguments[0],
      'benchmark-monitor-pools'
    );
    assert.equal(latest('router'), undefined);
    assert.deepEqual(latest('pd').activeKey, []);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const key of keys) {
      const descriptor = previous[key];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    }
  }
});

for (const pd of [false, true]) {
  test(`${pd ? 'PD' : 'ordinary'} benchmark defaults to core performance with ingress and resources collapsed`, () => {
    collapseProps.length = 0;
    const source = data(pd);
    const gateway = {
      ...metric('gateway'),
      measurement_scope: 'service_ingress'
    };
    source.runtime.metrics.ingress_ttft = gateway;
    source.runtime.metrics.ingress_e2e = gateway;
    renderToStaticMarkup(
      createElement(MonitoringCharts, {
        data: source,
        range: source.window,
        bands: [],
        view: 'aggregate',
        onViewChange() {}
      })
    );
    const primary = collapseProps.filter((props) =>
      [
        'llm',
        'pools',
        'router',
        'service',
        'stages',
        'cache',
        'pd',
        'gpu',
        'host'
      ].includes(props.items[0].key)
    );
    const keys = primary.map((props) => props.items[0].key);
    assert.equal(keys[0], pd ? 'pools' : 'llm');
    assert.equal(keys[1], 'service');
    if (pd) assert.equal(keys[2], 'pd');
    assert.ok(!keys.includes('router'));
    assert.deepEqual(
      primary.flatMap((props) => props.activeKey),
      [pd ? 'pools' : 'llm']
    );
  });
}

for (const targetMode of ['model_instance', 'route']) {
  test(`unsupported observations for ${targetMode} move to notes without empty sections or navigation targets`, () => {
    chartProps.length = 0;
    tableProps.length = 0;
    popoverProps.length = 0;
    const response = data(true);
    const unsupported = {
      ...metric('unavailable'),
      status: 'unsupported',
      reason: 'metric_not_provided',
      series: [],
      summaries: []
    };
    Object.assign(response.runtime.metrics, {
      ingress_ttft: unsupported,
      ingress_e2e: unsupported,
      router_health: unsupported,
      router_requests: metric('router_requests', ['router']),
      router_request_duration: metric('router_request_duration', ['router'])
    });
    const html = renderToStaticMarkup(
      createElement(MonitoringCharts, {
        data: response,
        range: response.window,
        bands: [],
        view: 'aggregate',
        onViewChange() {},
        targetMode
      })
    );
    assert.doesNotMatch(html, /data-section="service"/);
    assert.doesNotMatch(html, />Service experience<\/button>/);
    assert.doesNotMatch(html, /Router upstream member state/);
    assert.ok(
      chartProps.some((props) => props.metricKey === 'router_requests')
    );
    assert.ok(
      !chartProps.some((props) => props.metricKey === 'router_request_duration')
    );
    const notes = popoverProps.find((props) => props['data-observation-notes']);
    assert.ok(notes);
    assert.deepEqual(notes.trigger, ['click', 'hover', 'focus']);
    const text = renderToStaticMarkup(notes.content);
    assert.match(text, /Router upstream member state/);
    if (targetMode === 'model_instance')
      assert.match(text, /bypasses the GPUStack gateway/);
    else {
      assert.doesNotMatch(text, /bypasses the GPUStack gateway/);
      assert.match(text, /Not collected at the service ingress/);
    }
  });
}

test('fully unavailable standard groups disappear while supported zero, no-sample, error and restricted cards stay visible', () => {
  chartProps.length = 0;
  collapseProps.length = 0;
  const response = data();
  const absent = (status: string, reason: string | null = null) => ({
    ...metric('absent'),
    status,
    reason,
    series: [],
    summaries: []
  });
  Object.assign(response.runtime.metrics, {
    ttft: absent('no_data', 'no_samples'),
    tpot: absent('unsupported', 'metric_not_provided'),
    itl: metric('itl'),
    e2e: absent('query_error', 'query_failed'),
    queue: absent('restricted', 'resource_not_visible'),
    kv_usage: absent('unsupported'),
    prefix_cache_hit_rate: absent('unsupported'),
    external_cache_hit_rate: absent('not_applicable')
  });
  response.resources.metrics = Object.fromEntries(
    [
      'gpu_utilization',
      'gpu_memory_used',
      'gpu_memory_total',
      'gpu_power',
      'gpu_temperature'
    ].map((key) => [key, absent('unsupported')])
  );
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: response,
      range: response.window,
      bands: [],
      view: 'aggregate',
      onViewChange() {}
    })
  );
  assert.doesNotMatch(html, /data-section="cache"|data-section="gpu"/);
  assert.doesNotMatch(
    html,
    />Engine cache<\/button>|>GPU monitoring<\/button>/
  );
  assert.ok(
    chartProps.some((props) => props.metricKey === 'ttft' && props.compactEmpty)
  );
  assert.ok(
    chartProps.some((props) => props.metricKey === 'e2e' && !props.compactEmpty)
  );
  assert.ok(
    chartProps.some(
      (props) =>
        props.metricKey === 'queue' && props.metric.status === 'restricted'
    )
  );
  assert.ok(chartProps.some((props) => props.metricKey === 'itl'));
  assert.ok(!chartProps.some((props) => props.metricKey === 'tpot'));
  assert.ok(
    chartProps.some(
      (props) => props.metricKey === 'requests' && !props.compactEmpty
    )
  );
});

test('an ingress query failure remains visible beside omitted unsupported metrics', () => {
  chartProps.length = 0;
  const response = data(true);
  const failed = {
    ...metric('ingress'),
    measurement_scope: 'service_ingress',
    status: 'query_error',
    reason: 'query_failed',
    series: [],
    summaries: []
  };
  Object.assign(response.runtime.metrics, {
    ingress_ttft: failed,
    ingress_e2e: {
      ...failed,
      status: 'unsupported',
      reason: 'metric_not_provided'
    }
  });
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: response,
      range: response.window,
      bands: [],
      view: 'aggregate',
      onViewChange() {}
    })
  );
  assert.match(html, /data-section="service"/);
  assert.ok(
    chartProps.some(
      (props) =>
        props.title === 'Service TTFT' && props.metric.status === 'query_error'
    )
  );
  assert.ok(
    !chartProps.some((props) => props.title === 'Service request latency')
  );
});

for (const pd of [false, true]) {
  test(`routed ${pd ? 'PD' : 'ordinary'} Benchmark retains real gateway Avg and never invents instance percentiles`, () => {
    for (const view of ['aggregate', 'instances'] as const) {
      chartProps.length = 0;
      const response = data(pd);
      const gateway = {
        ...metric('gateway'),
        kind: 'histogram',
        unit: 'seconds',
        measurement_scope: 'service_ingress',
        supported_statistics: ['avg'],
        series: [
          {
            name: 'Service ingress',
            statistic: 'avg',
            dimensions: { source_name: 'gateway' },
            points: [[100, 0.12]]
          }
        ],
        summaries: [
          {
            statistic: 'avg',
            value: 0.12,
            dimensions: { source_name: 'gateway' }
          }
        ]
      };
      Object.assign(response.runtime.metrics, {
        ingress_ttft: gateway,
        ingress_e2e: gateway
      });
      response.instances = response.runtime;
      const html = renderToStaticMarkup(
        createElement(MonitoringCharts, {
          data: response,
          range: response.window,
          bands: [],
          view,
          onViewChange() {},
          targetMode: 'route'
        })
      );
      assert.match(html, /data-section="service"/);
      const ingress = chartProps.filter(
        (props) => props.metric?.measurement_scope === 'service_ingress'
      );
      assert.equal(ingress.length, 2);
      assert.ok(ingress.every((props) => props.metric === gateway));
      assert.ok(
        ingress.every(
          (props) => props.metric.supported_statistics.join(',') === 'avg'
        )
      );
    }
  });
}

test('load and exploration explanations live in adjacent help controls without changing measurement selection', async () => {
  const { JSDOM } = await import('jsdom');
  helpProps.length = 0;
  const points = [8, 4].map((load, sequence) => ({
    id: sequence + 1,
    load,
    raw: { sequence, input_tokens: 128, rate: load },
    total: 100,
    ok: 100,
    sloPass: null
  }));
  const html = renderToStaticMarkup(
    createElement(StageTimeline, {
      points,
      selectedId: 1,
      onSelect() {},
      data: data()
    } as any)
  );
  const document = new JSDOM(html).window.document;
  const loadHelp = helpProps.find((props) => props.label === 'Load comparison');
  const processHelp = helpProps.find(
    (props) => props.label === 'Exploration process'
  );
  assert.ok(loadHelp && processHelp);
  const loadText = renderToStaticMarkup(loadHelp.content);
  const processText = renderToStaticMarkup(processHelp.content);
  assert.match(loadText, /ascending load order/);
  assert.match(loadText, /0–100%/);
  assert.match(loadText, /original timestamp/);
  assert.match(loadText, /last valid sample in the selected measurement/);
  assert.match(processText, /recorded execution order/);
  assert.match(processText, /real time axis/);
  assert.match(processText, /last valid sample in the displayed interval/);
  assert.equal(document.querySelectorAll('button[aria-pressed]').length, 4);
  assert.equal(
    document.querySelectorAll('button[aria-label="Load comparison"]').length,
    1
  );
  assert.equal(
    document.querySelectorAll('button[aria-label="Exploration process"]')
      .length,
    1
  );
  assert.doesNotMatch(
    document.body.textContent || '',
    /0–100%|ascending load order/
  );
});

test('benchmark monitoring omits explanatory ribbons while keeping untimed-stage warnings and source help', () => {
  helpProps.length = 0;
  const html = renderToStaticMarkup(
    createElement(MonitoringCharts, {
      data: data(true),
      range: { start: 100, end: 400 },
      bands: [],
      timeSegments: [
        { id: 'first', start: 100, end: 200, label: '4', caption: '#1' }
      ],
      untimedCount: 2,
      view: 'aggregate',
      onViewChange() {}
    })
  );
  assert.doesNotMatch(
    html,
    /Original monitoring|Observation guide|modelMonitoring\.pd\.observationGuide/
  );
  assert.match(html, /measurements have no recorded time bounds/);
  const reading = helpProps.find((props) => props.label === 'Chart help');
  assert.ok(reading);
  const text = renderToStaticMarkup(reading.content);
  assert.match(text, /last valid sample in the selected measurement/);
  assert.ok(text.includes(translations['modelMonitoring.pd.scopeHelp']));
  assert.doesNotMatch(
    text,
    /summary covers the full selected interval|Observation guide/
  );
});
