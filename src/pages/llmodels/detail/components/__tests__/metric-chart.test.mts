import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const dom = new JSDOM('');
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: dom.window.document
});
after(() => dom.window.close());
let options: any;
mock.module('@gpustack/core-ui/charts', {
  namedExports: {
    echarts: { use() {} },
    Chart: (props: any) => {
      options = props.options;
      return createElement('div', { 'data-chart': true });
    },
    useChartConfig: () => ({
      isDark: false,
      token: { colorBgContainer: '#fff' },
      grid: {},
      legend: {},
      tooltip: {},
      xAxis: { axisLabel: {} },
      yAxis: { axisLabel: {} },
      lineItemConfig: {}
    })
  }
});
mock.module('echarts/components', {
  namedExports: { AriaComponent: {}, MarkPointComponent: {} }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module(new URL('../metric-chart.module.less', import.meta.url).href, {
  defaultExport: {}
});
const { default: MetricChart } = await import('../metric-chart');
const metric: any = {
  kind: 'histogram',
  unit: 'seconds',
  status: 'available',
  measurement_scope: 'engine',
  reason: null,
  supported_statistics: ['avg', 'p50', 'p95', 'p99'],
  summaries: ['avg', 'p50', 'p95', 'p99'].map((statistic, index) => ({
    statistic,
    dimensions: {},
    value: 0.01 * (index + 1),
    sample_count: 42
  })),
  series: [
    {
      name: 'P95',
      statistic: 'p95',
      dimensions: {},
      points: [
        [100, 9],
        [101, null],
        [102, 0]
      ]
    }
  ]
};
test('real chart presents four whole-window summaries and uses server points without smoothing or gap filling', () => {
  const html = renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'tpot',
      title: 'TPOT',
      metric
    })
  );
  for (const statistic of ['Avg', 'P50', 'P95', 'P99'])
    assert.ok(html.includes(statistic));
  assert.ok(!/\b(Min|Max)\b/.test(html));
  assert.ok(html.includes('ms/token'));
  assert.ok(!html.includes('modelMonitoring.engineScope'));
  assert.ok(
    html.includes('>30</div>'),
    'P95 summary must be server .03s rather than a trend maximum'
  );
  assert.equal(options.series[0].smooth, false);
  assert.equal(options.series[0].connectNulls, false);
  assert.equal(options.series[0].markPoint.symbolSize, 8);
  assert.ok(
    options.series[0].markPoint.data.some(
      (point: any) => point.xAxis === 2 && point.yAxis === 0
    )
  );
  assert.deepEqual(
    options.series[0].data.map((point: any) => point.value),
    [9, null, 0]
  );
});

test('an available histogram from an older server does not warn about missing samples alongside valid statistics and sparse points', () => {
  const html = renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'ttft',
      title: 'TTFT',
      metric: { ...metric, reason: 'no_samples' }
    })
  );
  assert.ok(!html.includes('modelMonitoring.state.no_samples'));
  assert.ok(!html.includes('ant-alert-warning'));
  assert.ok(html.includes('>30</div>'));
  assert.deepEqual(
    options.series[0].data.map((point: any) => point.value),
    [9, null, 0]
  );
});

for (const reason of ['query_failed', 'partial_source_observations']) {
  test(`an available partial metric retains its real ${reason} warning`, () => {
    const html = renderToStaticMarkup(
      createElement(MetricChart, {
        metricKey: 'ttft',
        title: 'TTFT',
        metric: { ...metric, reason }
      })
    );
    assert.ok(html.includes(`modelMonitoring.state.${reason}`));
    assert.ok(html.includes('ant-alert-warning'));
  });
}

test('memory capacity is a neutral reference in both the chart and legend', () => {
  const memory: any = {
    ...metric,
    kind: 'gauge',
    unit: 'bytes',
    summaries: [],
    series: ['Used', 'Total'].map((name, index) => ({
      name: `${name} · GPU`,
      statistic: 'current',
      dimensions: { device_id: 'one' },
      points: [[100, index + 1]]
    }))
  };
  const html = renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'gpu_memory_used',
      title: 'Memory',
      metric: memory,
      measures: ['Used', 'Total'],
      neutralMeasures: ['Total']
    } as any)
  );
  assert.notEqual(
    options.series[0].lineStyle.color,
    options.series[1].lineStyle.color
  );
  assert.equal(options.series[1].lineStyle.color, '#8b939e');
  assert.ok(html.includes('color:#8b939e'));
});

test('a single physical metric uses its readable chart title instead of an internal metric key', () => {
  const hardware: any = {
    ...metric,
    kind: 'gauge',
    unit: 'percent',
    summaries: [],
    series: [
      {
        name: 'gpu_utilization',
        statistic: 'current',
        dimensions: { worker_id: 1, device_id: 'device-a' },
        points: [[100, 0]]
      }
    ]
  };
  renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'gpu_utilization',
      title: 'GPU utilization',
      metric: hardware
    })
  );
  assert.deepEqual(options.legend.data, ['GPU utilization']);
  assert.equal(hardware.series[0].name, 'gpu_utilization');
});

test('backend aggregate names may repeat while histogram statistics retain independent legends and tooltips', () => {
  const aggregate: any = {
    ...metric,
    series: ['avg', 'p50', 'p95', 'p99'].map((statistic, index) => ({
      name: 'Deployment',
      statistic,
      dimensions: {},
      points: [[100, index + 1]]
    }))
  };
  renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'ttft',
      title: 'TTFT',
      metric: aggregate
    })
  );
  const names = options.series.map((series: any) => series.name);
  assert.equal(
    new Set(names).size,
    4,
    'all four statistics must have an independent ECharts legend identity'
  );
  assert.deepEqual(options.legend.data, names);
  assert.deepEqual(
    options.series.map((series: any) => series.lineStyle.color),
    ['#2563eb', '#16a34a', '#7c3aed', '#e0a800']
  );
  for (const statistic of ['Avg', 'P50', 'P95', 'P99'])
    assert.ok(names.some((name: string) => name.includes(statistic)));
  const tooltip = options.tooltip.formatter(
    names.map((seriesName: string) => ({
      seriesName,
      axisValueLabel: 'time',
      data: { value: 1 }
    }))
  ).textContent;
  for (const name of names) assert.ok(tooltip.includes(name));
});

test('all instance latency curves appear together without pagination or source mutation', () => {
  const source: any = {
    ...metric,
    series: ['avg', 'p50', 'p95', 'p99'].flatMap((statistic) =>
      [12, 13].map((id) => ({
        name: `instance-${id}`,
        statistic,
        dimensions: {
          model_instance_id: id,
          model_instance_name: `instance-${id}`
        },
        points: [[100, id]]
      }))
    )
  };
  const original = JSON.stringify(source);
  const html = renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'ttft',
      title: 'TTFT',
      metric: source
    })
  );
  assert.equal(options.series.length, 8);
  assert.deepEqual(
    options.series.map((item: any) => item.name),
    ['Avg', 'P50', 'P95', 'P99'].flatMap((statistic) =>
      [12, 13].map((id) => `${statistic} · instance-${id}`)
    )
  );
  assert.equal(
    new Set(options.series.map((item: any) => item.lineStyle.color)).size,
    8
  );
  assert.ok(
    options.series.every((item: any) => item.lineStyle.type === 'solid')
  );
  for (const item of options.series) {
    assert.equal(item.itemStyle.borderColor, item.lineStyle.color);
    assert.ok(html.includes(`color:${item.lineStyle.color}`));
  }
  assert.ok(!html.includes('1–4 /'));
  assert.equal(JSON.stringify(source), original);
});

test('legacy source labels stay internal while legends, tables and tooltips identify each instance only once', () => {
  const instance = 'qwen-prefill-0';
  const cache: any = {
    ...metric,
    kind: 'gauge',
    unit: 'percent',
    summaries: [],
    series: [
      {
        name: `prefill · ${instance} · legacy · DP 0`,
        statistic: 'current',
        dimensions: {
          role: 'prefill',
          model_instance_id: 7,
          model_instance_name: instance,
          source_name: 'legacy',
          dp_rank: '0'
        },
        points: [[100, 0]]
      }
    ]
  };
  renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'kv_usage',
      title: 'KV',
      metric: cache
    })
  );
  assert.deepEqual(options.legend.data, [`Prefill · ${instance} · DP 0`]);
  assert.equal(options.series[0].name, options.legend.data[0]);
  assert.deepEqual(
    options.series[0].data.map((point: any) => point.value),
    [0]
  );
  const tooltip = options.tooltip.formatter([
    {
      seriesName: options.series[0].name,
      axisValueLabel: 'time',
      data: { value: 0 }
    }
  ]).textContent;
  assert.ok(!tooltip.includes('legacy'));
  assert.equal(tooltip.split(instance).length - 1, 1);
  assert.equal(
    cache.series[0].dimensions.source_name,
    'legacy',
    'display cleanup must preserve source identity'
  );
});

test('source cleanup preserves measure prefixes, named sources and endpoint/native DP distinctions', () => {
  const source: any = {
    ...metric,
    kind: 'gauge',
    unit: 'requests',
    series: [
      {
        name: 'Waiting · decode · instance-a · engine/main-2 · DP 2',
        statistic: 'current',
        dimensions: {
          role: 'decode',
          model_instance_name: 'instance-a',
          source_name: 'engine/main-2',
          endpoint_dp_rank: '1',
          dp_rank: '2'
        },
        points: [[100, 4]]
      }
    ]
  };
  renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'requests',
      title: 'Requests',
      metric: source,
      measures: ['Waiting']
    })
  );
  assert.deepEqual(options.legend.data, [
    'Waiting · Decode · instance-a · engine/main-2 · Endpoint DP 1 · DP 2'
  ]);
});

test('an actual instance named legacy remains visible', () => {
  const source: any = {
    ...metric,
    series: [
      {
        name: 'prefill · legacy · legacy',
        statistic: 'p95',
        dimensions: {
          role: 'prefill',
          model_instance_name: 'legacy',
          source_name: 'legacy'
        },
        points: [[100, 1]]
      }
    ]
  };
  renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'ttft',
      title: 'TTFT',
      metric: source
    })
  );
  assert.deepEqual(options.legend.data, ['P95 · Prefill · legacy']);
});

test('an available mean keeps the incompatible-bucket explanation when percentile summaries are missing', () => {
  const partial: any = {
    ...metric,
    reason: 'incompatible_histogram_buckets',
    series: [],
    summaries: metric.summaries.map((summary: any) => ({
      ...summary,
      value: summary.statistic === 'avg' ? 0.01 : null
    }))
  };
  const html = renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'ttft',
      title: 'TTFT',
      metric: partial
    })
  );
  assert.ok(html.includes('>10</div>'));
  assert.ok(
    html.includes('modelMonitoring.state.incompatible_histogram_buckets')
  );
});

test('PD aggregate gauges keep fixed role colors and use solid lines', () => {
  const gauge: any = {
    ...metric,
    kind: 'gauge',
    unit: 'requests',
    supported_statistics: ['current'],
    summaries: [],
    series: ['prefill', 'decode', 'router'].map((role, index) => ({
      name: role,
      statistic: 'current',
      dimensions: { role },
      points: [[100, index + 1]]
    }))
  };
  renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'waiting_requests',
      title: 'Waiting',
      metric: gauge
    })
  );
  const byRole = Object.fromEntries(
    options.series.map((series: any, index: number) => [
      gauge.series[index].dimensions.role,
      series.lineStyle
    ])
  );
  assert.deepEqual(
    ['prefill', 'decode', 'router'].map((role) => byRole[role].color),
    ['#2563eb', '#16a34a', '#7c3aed']
  );
  assert.equal(
    new Set(
      ['prefill', 'decode', 'router'].map((role) =>
        JSON.stringify(byRole[role].type)
      )
    ).size,
    1
  );
  const filtered = { ...gauge, series: gauge.series.slice(1, 2) };
  renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'waiting_requests',
      title: 'Waiting',
      metric: filtered
    })
  );
  assert.equal(options.series[0].lineStyle.color, byRole.decode.color);
  assert.deepEqual(options.series[0].lineStyle.type, byRole.decode.type);
});

test('comparison measures remain distinguishable even when both series share the Decode role', () => {
  for (const [kind, statistic, measures] of [
    ['counter', 'rate', ['Input', 'Output']],
    ['gauge', 'current', ['Running', 'Waiting']]
  ] as const) {
    const comparison: any = {
      ...metric,
      kind,
      unit: kind === 'counter' ? 'tokens_per_second' : 'requests',
      supported_statistics: [statistic],
      summaries: [],
      series: measures.map((name, index) => ({
        name: `${name} · Deployment`,
        statistic,
        dimensions: { role: 'decode' },
        points: [[100, index + 1]]
      }))
    };
    renderToStaticMarkup(
      createElement(MetricChart, {
        metricKey: 'comparison',
        title: 'Comparison',
        metric: comparison,
        measures: [...measures]
      })
    );
    assert.deepEqual(
      options.series.map((series: any) => series.lineStyle.color),
      ['#2563eb', '#16a34a']
    );
    assert.equal(
      options.series[0].lineStyle.type,
      options.series[1].lineStyle.type
    );
  }
});

test('same-role instances use distinct colors and only solid lines', () => {
  const comparison: any = {
    ...metric,
    kind: 'gauge',
    unit: 'percent',
    summaries: [],
    series: [1, 5, 9, 13].map((id) => ({
      name: `instance-${id}`,
      statistic: 'current',
      dimensions: { role: 'decode', model_instance_id: id },
      points: [
        [100, id],
        [101, id + 1]
      ]
    }))
  };
  renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'kv_usage',
      title: 'KV',
      metric: comparison
    })
  );
  assert.equal(
    new Set(options.series.map((item: any) => item.lineStyle.color)).size,
    4
  );
  assert.equal(
    new Set(options.series.map((item: any) => item.lineStyle.type)).size,
    1
  );
  assert.ok(
    options.series.every((item: any) => item.lineStyle.type === 'solid')
  );
  assert.ok(
    options.series.every(
      (item: any) =>
        item.showSymbol === false && item.markPoint.data.length === 0
    )
  );
});

test('legend shows the last finite sample including zero without a time column', () => {
  const source: any = {
    ...metric,
    series: [
      {
        ...metric.series[0],
        points: [
          [100, 2],
          [101, 0],
          [102, null]
        ]
      }
    ]
  };
  const html = renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'tpot',
      title: 'TPOT',
      metric: source
    })
  );
  assert.ok(html.includes('modelMonitoring.latestValidSample'));
  assert.ok(html.includes('0 ms/token'));
  assert.ok(!html.includes('<time'));
  assert.ok(!html.includes(new Date(102000).toISOString()));
  assert.equal(options.series[0].id, JSON.stringify(['P95', 'p95', []]));
  assert.deepEqual(
    options.series[0].data.map((point: any) => point.value),
    [2, 0, null]
  );
});

test('whole-window statistics expose observation counts without inventing a count', () => {
  const source: any = {
    ...metric,
    summaries: metric.summaries.map((summary: any, index: number) => ({
      ...summary,
      sample_count: index === 3 ? null : 42
    }))
  };
  const html = renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'ttft',
      title: 'TTFT',
      metric: source
    })
  );
  assert.ok(html.includes('modelMonitoring.sampleCount: 42'));
  assert.ok(!html.includes('modelMonitoring.sampleCount: 0'));
});

test('legend reads the latest timestamp rather than input order and ignores non-finite samples', () => {
  const source: any = {
    ...metric,
    series: [
      {
        ...metric.series[0],
        points: [
          [104, Infinity],
          [103, 0],
          [105, NaN],
          [102, 2]
        ]
      }
    ]
  };
  const html = renderToStaticMarkup(
    createElement(MetricChart, {
      metricKey: 'tpot',
      title: 'TPOT',
      metric: source
    })
  );
  assert.ok(!html.includes('<time'));
  assert.ok(html.includes('0 ms/token'));
});
