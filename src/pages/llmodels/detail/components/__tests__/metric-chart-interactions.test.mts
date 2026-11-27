import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, useImperativeHandle } from 'react';

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  pretendToBeVisual: true
});
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'SVGElement',
  'ShadowRoot',
  'Element',
  'Node',
  'MutationObserver',
  'getComputedStyle'
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
const dispatchAction = mock.fn();
let options: any;
let coordinateMultiplier = 1000;
const { Select } = await import('antd');
mock.module('@gpustack/core-ui', {
  namedExports: {
    BaseSelect: Select,
    SimpleSelect: Select,
    TextAttribute: ({ children, ...props }: any) =>
      createElement('span', props, children)
  }
});
mock.module('@gpustack/core-ui/charts', {
  namedExports: {
    echarts: { use() {} },
    Chart: forwardRef((props: any, ref) => {
      options = props.options;
      useImperativeHandle(ref, () => ({
        chart: {
          dispatchAction,
          getDom: () => ({ getBoundingClientRect: () => ({ left: 0 }) }),
          convertFromPixel: (_axis: any, value: number) =>
            value * coordinateMultiplier
        }
      }));
      return createElement('div');
    }),
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
  namedExports: {
    AriaComponent: {},
    MarkAreaComponent: {},
    MarkPointComponent: {}
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../metric-chart.module.less', import.meta.url).href, {
  defaultExport: { highlightRow: 'highlight-row' }
});
const { createRoot } = await import('react-dom/client');
const { default: MetricChart } = await import('../metric-chart');
const { LatencyStatisticsProvider } =
  await import('../../config/latency-statistics-context');
const { LatencyStatisticsControl } = await import('../latency-statistics');
const metric: any = {
  kind: 'gauge',
  unit: 'percent',
  status: 'available',
  reason: null,
  summaries: [],
  series: [
    {
      name: 'Device',
      statistic: 'current',
      dimensions: {},
      points: [
        [100, 0],
        [101, 2]
      ]
    }
  ]
};
const mount = async (source = metric, context: any = {}) => {
  dispatchAction.mock.resetCalls();
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  await act(async () =>
    root.render(
      createElement(MetricChart, {
        title: 'GPU',
        metricKey: 'gpu_utilization',
        metric: source,
        ...context
      })
    )
  );
  return {
    container,
    rerender: (source: any, metricKey = 'gpu_utilization') =>
      act(async () =>
        root.render(
          createElement(MetricChart, {
            title: 'GPU',
            metricKey,
            metric: source,
            ...context
          })
        )
      ),
    unmount: () => act(async () => root.unmount())
  };
};

test('all-censored instance quantiles retain their lower bounds when switching to the data table', async () => {
  const source = {
    ...metric,
    kind: 'histogram',
    unit: 'seconds',
    reason: 'histogram_quantile_out_of_range',
    series: [
      {
        ...metric.series[0],
        statistic: 'p99',
        points: [
          [100, null],
          [101, null]
        ],
        lower_bounds: [
          [100, 5],
          [101, 5]
        ]
      }
    ]
  };
  const view = await mount(source, {
    title: 'Transfer',
    metricKey: 'pd_kv_transfer',
    showSummary: false
  });
  try {
    assert.ok(view.container.textContent?.includes('> 5,000 ms'));
    assert.ok(
      !view.container.textContent?.includes('modelMonitoring.state.no_data')
    );
    const table = view.container.querySelector(
      'button[aria-label="modelMonitoring.table"]'
    ) as HTMLElement;
    assert.ok(table);
    await act(async () => table.click());
    const cells = [...view.container.querySelectorAll('tbody td')].map(
      (cell) => cell.textContent
    );
    assert.equal(cells.filter((text) => text === '> 5,000').length, 2);
  } finally {
    await view.unmount();
  }
});

test('shared cursor readouts follow the shared timestamp and leave an exact missing sample empty', async () => {
  for (const timestamp of [101, 102]) {
    const view = await mount(metric, {
      exactCursor: true,
      interaction: { timestamp, pinned: true, onChange() {} }
    });
    try {
      const text =
        view.container.querySelector('[aria-live]')?.textContent || '';
      assert.ok(text.includes(timestamp === 101 ? '2 %' : '—'), text);
      assert.ok(!text.includes('0 %'), text);
    } finally {
      await view.unmount();
    }
  }
});

for (const [status, reason] of [
  ['unsupported', 'metric_not_provided'],
  ['no_observations', 'zero_observations'],
  ['restricted', null],
  ['query_error', 'query_failed']
]) {
  test(`empty metric keeps the reason for ${status} without a table control`, async (t) => {
    const chart = await mount({ ...metric, status, reason, series: [] });
    t.after(chart.unmount);
    const toggle = [...chart.container.querySelectorAll('button')].find(
      (button) => button.getAttribute('aria-label') === 'modelMonitoring.table'
    );
    assert.equal(toggle, undefined);
    assert.equal(chart.container.querySelector('table'), null);
    assert.ok(
      chart.container.textContent?.includes(
        `modelMonitoring.state.${reason || status}`
      )
    );
  });
}

test('keyboard sample inspection can be dismissed with Escape without blurring the chart', async (t) => {
  const chart = await mount();
  t.after(chart.unmount);
  const plot = chart.container.querySelector<HTMLElement>('[tabindex="0"]')!;
  await act(async () => {
    plot.focus();
    plot.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true })
    );
    plot.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
  });
  assert.deepEqual(dispatchAction.mock.calls.at(-1)?.arguments, [
    { type: 'hideTip' }
  ]);
  assert.equal(document.activeElement, plot);
});

test('an entirely empty metric has one explanation without empty rows or legends', async (t) => {
  const chart = await mount({
    ...metric,
    status: 'no_observations',
    reason: 'zero_observations',
    series: [
      {
        ...metric.series[0],
        points: [
          [100, null],
          [101, null]
        ]
      }
    ]
  });
  t.after(chart.unmount);
  const toggle = [...chart.container.querySelectorAll('button')].find(
    (button) => button.getAttribute('aria-label') === 'modelMonitoring.table'
  );
  assert.equal(toggle, undefined);
  assert.equal(chart.container.querySelectorAll('.ant-empty').length, 1);
  assert.equal(chart.container.querySelector('table'), null);
  assert.equal(
    chart.container.querySelector(
      '[aria-label="modelMonitoring.seriesLegend"]'
    ),
    null
  );
});

test('a refresh with no samples explains the whole metric rather than an old selection', async (t) => {
  const source = {
    ...metric,
    series: [metric.series[0], { ...metric.series[0], name: 'Other' }]
  };
  const chart = await mount(source);
  t.after(chart.unmount);
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>(
        '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
      )!
      .click()
  );
  await chart.rerender({
    ...source,
    status: 'no_data',
    reason: 'no_samples',
    series: source.series.map((s: any) => ({
      ...s,
      points: [
        [100, null],
        [101, null]
      ]
    }))
  });
  assert.ok(
    chart.container.textContent?.includes('modelMonitoring.state.no_samples')
  );
  assert.ok(
    !chart.container.textContent?.includes(
      'modelMonitoring.selectedSeriesNoSamples'
    )
  );
  assert.equal(
    chart.container.querySelector(
      '[aria-label="modelMonitoring.showAllSeries"]'
    ),
    null
  );
  assert.equal(
    chart.container.querySelector(
      '[aria-label="modelMonitoring.seriesLegend"]'
    ),
    null
  );
});

test('legend click isolates one curve and another click restores every curve', async (t) => {
  const chart = await mount({
    ...metric,
    series: [metric.series[0], { ...metric.series[0], name: 'Other' }]
  });
  t.after(chart.unmount);
  const legend = chart.container.querySelector<HTMLElement>(
    '[aria-label="modelMonitoring.seriesLegend"]'
  );
  assert.ok(legend);
  const resetButton = () =>
    [...chart.container.querySelectorAll('button')].find(
      (button) =>
        button.getAttribute('aria-label') === 'modelMonitoring.showAllSeries'
    );
  assert.equal(resetButton(), undefined);
  const toggle = legend.querySelector<HTMLButtonElement>(
    'button[aria-pressed]'
  )!;
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  await act(async () => toggle.click());
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(
    options.series.map((item: any) => item.name),
    ['Device']
  );
  assert.equal(legend.querySelectorAll('[aria-pressed="false"]').length, 1);
  const tooltip = options.tooltip.formatter([
    { dataIndex: 1, axisValueLabel: 'time' }
  ]);
  assert.ok(tooltip.textContent.includes('Device'));
  assert.ok(!tooltip.textContent.includes('Other'));
  assert.equal(resetButton()?.disabled, false);
  await act(async () => toggle.click());
  assert.equal(options.series.length, 2);
  assert.equal(legend.querySelectorAll('[aria-pressed="false"]').length, 0);
  assert.equal(resetButton(), undefined);
});

test('table columns retain an isolated censored series and Show all restores columns in place', async (t) => {
  const chart = await mount({
    ...metric,
    kind: 'histogram',
    unit: 'seconds',
    series: [
      { ...metric.series[0], name: 'Avg', statistic: 'avg' },
      {
        ...metric.series[0],
        name: 'P99',
        statistic: 'p99',
        points: [
          [100, null],
          [101, 0]
        ],
        lower_bounds: [[100, 5]]
      }
    ]
  });
  t.after(chart.unmount);
  await act(async () =>
    chart.container
      .querySelectorAll<HTMLButtonElement>(
        '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
      )[1]
      .click()
  );
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>('[aria-label="modelMonitoring.table"]')!
      .click()
  );
  const headers = () =>
    [...chart.container.querySelectorAll('thead th')].map(
      (cell) => cell.textContent
    );
  assert.deepEqual(headers(), ['modelMonitoring.time', 'P99']);
  assert.deepEqual(
    [...chart.container.querySelectorAll('tbody tr')].map(
      (row) => row.lastElementChild?.textContent
    ),
    ['> 5,000', '0']
  );
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>('[aria-label="modelMonitoring.chart"]')!
      .click()
  );
  assert.deepEqual(
    options.series.map((item: any) => item.name),
    ['P99']
  );
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>('[aria-label="modelMonitoring.table"]')!
      .click()
  );
  const reset = chart.container.querySelector<HTMLButtonElement>(
    '[aria-label="modelMonitoring.showAllSeries"]'
  );
  assert.ok(reset);
  await act(async () => reset.click());
  assert.deepEqual(headers(), ['modelMonitoring.time', 'Avg', 'P99']);
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>('[aria-label="modelMonitoring.chart"]')!
      .click()
  );
  assert.equal(options.series.length, 2);
  assert.equal(
    chart.container.querySelectorAll(
      '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed="false"]'
    ).length,
    0
  );
});

test('table follows multi-selection across filtered populations and never keeps a vanished selection', async (t) => {
  const source = {
    ...metric,
    series: [1, 2, 3].map((id) => ({
      ...metric.series[0],
      name: `GPU ${id}`,
      dimensions: { device_id: `opaque-${id}`, worker_id: 1 }
    }))
  };
  const chart = await mount(source);
  t.after(chart.unmount);
  const items = chart.container.querySelectorAll<HTMLButtonElement>(
    '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
  );
  await act(async () => items[0].click());
  await act(async () =>
    items[2].dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, ctrlKey: true })
    )
  );
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>('[aria-label="modelMonitoring.table"]')!
      .click()
  );
  const names = () =>
    [...chart.container.querySelectorAll('thead th')]
      .slice(1)
      .map((cell) => cell.textContent);
  assert.deepEqual(names(), ['GPU 1', 'GPU 3']);
  await chart.rerender({ ...source, series: source.series.slice(1) });
  assert.deepEqual(names(), ['GPU 3']);
  await chart.rerender({ ...source, series: [source.series[1]] });
  assert.deepEqual(names(), ['GPU 2']);
  assert.equal(
    chart.container.querySelector(
      '[aria-label="modelMonitoring.showAllSeries"]'
    ),
    null
  );
});

test('removing the final selected curve restores all series in both views', async (t) => {
  const chart = await mount({
    ...metric,
    series: ['A', 'B'].map((name) => ({ ...metric.series[0], name }))
  });
  t.after(chart.unmount);
  const item = chart.container.querySelector<HTMLButtonElement>(
    '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
  )!;
  await act(async () => item.click());
  await act(async () =>
    item.dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, ctrlKey: true })
    )
  );
  assert.equal(options.series.length, 2);
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>('[aria-label="modelMonitoring.table"]')!
      .click()
  );
  assert.equal(chart.container.querySelectorAll('thead th').length, 3);
});

test('keyboard inspection follows the isolated plotted curve rather than an index in the full legend', async (t) => {
  const chart = await mount({
    ...metric,
    series: [metric.series[0], { ...metric.series[0], name: 'Other' }]
  });
  t.after(chart.unmount);
  const legend = chart.container.querySelector<HTMLElement>(
    '[aria-label="modelMonitoring.seriesLegend"]'
  )!;
  await act(async () =>
    legend
      .querySelectorAll<HTMLButtonElement>(
        '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
      )[1]
      .click()
  );
  const plot = chart.container.querySelector<HTMLElement>('[tabindex="0"]')!;
  await act(async () =>
    plot.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true })
    )
  );
  assert.deepEqual(dispatchAction.mock.calls.at(-1)?.arguments, [
    { type: 'showTip', seriesIndex: 0, dataIndex: 1 }
  ]);
  assert.equal(options.series[0].name, 'Other');
});

test('modifier clicks and keyboard activation add or remove curves while Show all restores the set', async (t) => {
  const chart = await mount({
    ...metric,
    series: ['A', 'B', 'C'].map((name) => ({ ...metric.series[0], name }))
  });
  t.after(chart.unmount);
  const items = chart.container.querySelectorAll<HTMLButtonElement>(
    '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
  );
  await act(async () => items[0].click());
  await act(async () =>
    items[1].dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, ctrlKey: true })
    )
  );
  assert.deepEqual(
    options.series.map((item: any) => item.name),
    ['A', 'B']
  );
  await act(async () =>
    items[0].dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, metaKey: true })
    )
  );
  assert.deepEqual(
    options.series.map((item: any) => item.name),
    ['B']
  );
  await act(async () =>
    items[2].dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        bubbles: true,
        key: ' ',
        shiftKey: true
      })
    )
  );
  assert.deepEqual(
    options.series.map((item: any) => item.name),
    ['B', 'C']
  );
  await act(async () =>
    items[0].dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    )
  );
  assert.deepEqual(
    options.series.map((item: any) => item.name),
    ['A']
  );
  const reset = [...chart.container.querySelectorAll('button')].find(
    (item) =>
      item.getAttribute('aria-label') === 'modelMonitoring.showAllSeries'
  )!;
  await act(async () => reset.click());
  assert.equal(options.series.length, 3);
  assert.ok(!chart.container.contains(reset));
});

for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey']) {
  test(`${modifier} toggles a visible curve from the initially complete set`, async (t) => {
    const chart = await mount({
      ...metric,
      series: ['A', 'B', 'C'].map((name) => ({ ...metric.series[0], name }))
    });
    t.after(chart.unmount);
    const target = chart.container.querySelectorAll<HTMLButtonElement>(
      '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
    )[2];
    const toggle = () =>
      target.dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true, [modifier]: true })
      );
    await act(async () => {
      toggle();
    });
    assert.deepEqual(
      options.series.map((item: any) => item.name),
      ['A', 'B']
    );
    assert.equal(target.getAttribute('aria-pressed'), 'false');
    await act(async () => {
      toggle();
    });
    assert.equal(options.series.length, 3);
    assert.equal(target.getAttribute('aria-pressed'), 'true');
  });
}

test('sampling refreshes and renamed resources retain selection, while a new population or metric restores all', async (t) => {
  const source = {
    ...metric,
    series: [1, 2].map((id) => ({
      ...metric.series[0],
      name: `GPU ${id}`,
      dimensions: { device_id: `opaque-${id}`, worker_id: 1 }
    }))
  };
  const chart = await mount(source);
  t.after(chart.unmount);
  await act(async () =>
    chart.container
      .querySelectorAll<HTMLButtonElement>(
        '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
      )[1]
      .click()
  );
  await chart.rerender({
    ...source,
    series: [...source.series]
      .reverse()
      .map((item) => ({ ...item, name: `${item.name} renamed` }))
  });
  assert.equal(options.series.length, 1);
  assert.equal(options.series[0].name, 'GPU 2 renamed');
  const replacement = {
    ...source,
    series: [3, 4].map((id) => ({
      ...source.series[0],
      name: `GPU ${id}`,
      dimensions: { device_id: `opaque-${id}`, worker_id: 1 }
    }))
  };
  await chart.rerender(replacement);
  assert.equal(options.series.length, 2);
  await act(async () =>
    chart.container
      .querySelectorAll<HTMLButtonElement>(
        '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
      )[0]
      .click()
  );
  await chart.rerender(replacement, 'gpu_power');
  assert.equal(options.series.length, 2);
});

test('isolating an empty device explains the selected gap while a real zero remains readable', async (t) => {
  const chart = await mount({
    ...metric,
    series: [
      metric.series[0],
      {
        ...metric.series[0],
        name: 'Missing',
        points: [
          [100, null],
          [101, null]
        ]
      }
    ]
  });
  t.after(chart.unmount);
  const items = chart.container.querySelectorAll<HTMLButtonElement>(
    '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
  );
  await act(async () => items[1].click());
  assert.ok(
    chart.container.textContent?.includes(
      'modelMonitoring.selectedSeriesNoSamples'
    )
  );
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>('[aria-label="modelMonitoring.table"]')!
      .click()
  );
  assert.equal(chart.container.querySelectorAll('thead th').length, 2);
  assert.equal(
    chart.container.querySelector('thead th:last-child')!.textContent,
    'Missing'
  );
  assert.deepEqual(
    [...chart.container.querySelectorAll('tbody tr')].map(
      (row) => row.lastElementChild!.textContent
    ),
    ['—', '—']
  );
  await act(async () =>
    chart.container
      .querySelector<HTMLButtonElement>('[aria-label="modelMonitoring.chart"]')!
      .click()
  );
  const currentItems = chart.container.querySelectorAll<HTMLButtonElement>(
    '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
  );
  await act(async () => currentItems[0].click());
  assert.ok(
    !chart.container.textContent?.includes(
      'modelMonitoring.selectedSeriesNoSamples'
    )
  );
  assert.deepEqual(
    options.series[0].data.map((item: any) => item.value),
    [0, 2]
  );
});

test('128 curves remain available together and the last legend item can be isolated without pagination', async (t) => {
  const source = {
    ...metric,
    kind: 'histogram',
    unit: 'seconds',
    series: ['avg', 'p50', 'p95', 'p99'].flatMap((statistic) =>
      Array.from({ length: 32 }, (_, index) => ({
        ...metric.series[0],
        statistic,
        name: `Instance ${index + 1}`,
        dimensions: {
          model_instance_id: index + 1,
          model_instance_name: `Instance ${index + 1}`
        }
      }))
    )
  };
  const chart = await mount(source);
  t.after(chart.unmount);
  assert.equal(options.series.length, 128);
  const tooltip = options.tooltip.formatter([{ dataIndex: 1 }]);
  assert.equal(tooltip.children.length, 14);
  assert.ok(tooltip.textContent.includes('modelMonitoring.moreSeries'));
  const items = chart.container.querySelectorAll<HTMLButtonElement>(
    '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
  );
  assert.equal(items.length, 128);
  assert.ok(!chart.container.textContent?.includes('1–4 /'));
  await act(async () =>
    items[127].dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })
    )
  );
  assert.equal(options.series.length, 1);
  assert.equal(
    options.series[0].name,
    items[127].querySelector('span[title]')?.textContent
  );
});

test('Benchmark context preserves curves while hiding summaries and shading exact half-open stages', async (t) => {
  const source = {
    ...metric,
    kind: 'histogram',
    unit: 'seconds',
    summaries: [{ statistic: 'p99', dimensions: {}, value: 99 }],
    series: [1, 2].map((id) => ({
      ...metric.series[0],
      name: `Instance ${id}`,
      statistic: 'p99',
      dimensions: { model_instance_id: id },
      points: [
        [100, 0],
        [110, null],
        [120, 2],
        [130, 3]
      ]
    }))
  };
  const chart = await mount(source, {
    showSummary: false,
    timeRange: { start: 100, end: 130 },
    timeBands: [
      { start: 100, end: 110, label: 'Base', kind: 'baseline' },
      { start: 110, end: 120, label: 'Current', kind: 'selected' }
    ],
    focus: { dimension: 'model_instance_id', values: [2] }
  });
  t.after(chart.unmount);
  assert.equal(
    chart.container.querySelector(
      '[aria-label="modelMonitoring.intervalStats"]'
    ),
    null
  );
  assert.equal(options.xAxis.type, 'time');
  assert.equal(options.xAxis.min, 100000);
  assert.equal(options.xAxis.max, 130000);
  assert.equal(options.series.length, 2);
  assert.equal(options.series[0].lineStyle.opacity, 0.18);
  assert.equal(options.series[1].lineStyle.opacity, 1);
  assert.deepEqual(
    options.series[1].data.map((point: any) => point.value),
    [
      [100000, 0],
      [110000, null],
      [120000, 2]
    ]
  );
  assert.deepEqual(
    options.series[0].markArea.data.map((band: any) => [
      band[0].xAxis,
      band[1].xAxis
    ]),
    [
      [100000, 110000],
      [110000, 120000]
    ]
  );
  assert.equal(
    chart.container.querySelectorAll('button[data-focused="false"]').length,
    1
  );
  const toggle = chart.container.querySelector<HTMLButtonElement>(
    '[aria-label="modelMonitoring.table"]'
  )!;
  assert.equal(toggle.textContent, '');
  await act(async () => toggle.click());
  assert.equal(chart.container.querySelectorAll('tbody tr').length, 3);
  assert.equal(
    chart.container.querySelectorAll('tbody tr.highlight-row').length,
    2
  );
  assert.equal(
    chart.container.querySelectorAll('tbody tr').item(2).className,
    ''
  );
});

test('shared cursor inspection pins the real sample and Escape clears shared state', async (t) => {
  const onChange = mock.fn();
  const chart = await mount(metric, {
    timeRange: { start: 99, end: 102 },
    interaction: { timestamp: 101, pinned: false, onChange }
  });
  t.after(chart.unmount);
  assert.deepEqual(dispatchAction.mock.calls.at(-1)?.arguments, [
    { type: 'showTip', seriesIndex: 0, dataIndex: 1 }
  ]);
  const plot = chart.container.querySelector<HTMLElement>('[tabindex="0"]')!;
  await act(async () =>
    plot.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true })
    )
  );
  assert.deepEqual(onChange.mock.calls.at(-1)?.arguments, [
    { timestamp: 101, pinned: true }
  ]);
  await act(async () =>
    plot.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
  );
  assert.deepEqual(onChange.mock.calls.at(-1)?.arguments, [
    { timestamp: null, pinned: false }
  ]);
});

test('pointer inspection uses time coordinates and pinning survives pointer leave', async (t) => {
  const onChange = mock.fn();
  const context = {
    timeRange: { start: 99, end: 102 },
    interaction: { timestamp: null as number | null, pinned: false, onChange }
  };
  const chart = await mount(metric, context);
  t.after(chart.unmount);
  const plot = chart.container.querySelector<HTMLElement>('[tabindex="0"]')!;
  await act(async () =>
    plot.dispatchEvent(
      new dom.window.MouseEvent('mousemove', { clientX: 100.8, bubbles: true })
    )
  );
  assert.deepEqual(onChange.mock.calls.at(-1)?.arguments, [
    { timestamp: 101, pinned: false }
  ]);
  await act(async () =>
    plot.dispatchEvent(
      new dom.window.MouseEvent('click', { clientX: 100.8, bubbles: true })
    )
  );
  assert.deepEqual(onChange.mock.calls.at(-1)?.arguments, [
    { timestamp: 101, pinned: true }
  ]);
  context.interaction = { timestamp: 101, pinned: true, onChange };
  await chart.rerender(metric);
  const count = onChange.mock.calls.length;
  await act(async () => {
    plot.dispatchEvent(
      new dom.window.MouseEvent('mousemove', { clientX: 100, bubbles: true })
    );
    plot.dispatchEvent(
      new dom.window.MouseEvent('mouseout', { bubbles: true })
    );
  });
  assert.equal(onChange.mock.calls.length, count);
});

test('an exact shared cursor never borrows a neighboring sample across a missing observation', async (t) => {
  const chart = await mount(metric, {
    timeRange: { start: 99, end: 102 },
    exactCursor: true,
    interaction: { timestamp: 100.5, pinned: true, onChange() {} }
  });
  t.after(chart.unmount);
  assert.equal(
    dispatchAction.mock.calls.some(
      (call) => call.arguments[0]?.type === 'showTip'
    ),
    false
  );
  assert.deepEqual(dispatchAction.mock.calls.at(-1)?.arguments, [
    { type: 'hideTip' }
  ]);
});

for (const axis of ['category', 'time', 'segments']) {
  test(`${axis} legends share cursor values with readouts without borrowing another role's sample`, async (t) => {
    const context: any = {
      exactCursor: true,
      interaction: { timestamp: 100, pinned: true, onChange() {} },
      ...(axis === 'category' ? {} : { timeRange: { start: 100, end: 104 } }),
      ...(axis === 'segments'
        ? {
            timeSegments: [
              {
                id: '1',
                start: 100,
                end: 104,
                label: '1',
                caption: '#1',
                description: 'Measurement #1'
              }
            ]
          }
        : {})
    };
    const source = {
      ...metric,
      kind: 'histogram',
      unit: 'seconds',
      series: [
        {
          ...metric.series[0],
          name: 'Prefill',
          statistic: 'p99',
          dimensions: { role: 'prefill' },
          points: [
            [100, 0],
            [101, null],
            [103, 9]
          ],
          lower_bounds: [[101, 5]]
        },
        {
          ...metric.series[0],
          name: 'Decode',
          statistic: 'p99',
          dimensions: { role: 'decode' },
          points: [
            [100, 1],
            [103, 20]
          ]
        }
      ]
    };
    const chart = await mount(source, context);
    t.after(chart.unmount);
    const values = () =>
      [
        ...chart.container.querySelectorAll(
          '[aria-label="modelMonitoring.seriesLegend"] button[aria-pressed]'
        )
      ].map(
        (button) =>
          button.querySelector('span[title]')!.nextElementSibling!.textContent
      );
    assert.deepEqual(values(), ['1,000 ms', '0 ms']);
    context.interaction = { ...context.interaction, timestamp: 101 };
    await chart.rerender(source);
    assert.deepEqual(values(), ['—', '> 5,000 ms']);
    assert.match(
      chart.container.querySelector('[aria-live]')!.textContent!,
      /Decode.*—.*Prefill.*> 5,000 ms/
    );
    context.interaction = { ...context.interaction, timestamp: 102 };
    await chart.rerender(source);
    assert.deepEqual(values(), ['—', '—']);
    context.interaction = {
      ...context.interaction,
      timestamp: null,
      pinned: false
    };
    await chart.rerender(source);
    assert.deepEqual(values(), ['20,000 ms', '9,000 ms']);
  });
}

test('a non-exact time cursor uses the same nearest timestamp for the legend and readout', async (t) => {
  const chart = await mount(metric, {
    timeRange: { start: 99, end: 102 },
    interaction: { timestamp: 100.2, pinned: true, onChange() {} }
  });
  t.after(chart.unmount);
  const legend = chart.container.querySelector(
    '[aria-label="modelMonitoring.seriesLegend"]'
  )!;
  assert.match(legend.textContent!, /0 %/);
  assert.doesNotMatch(legend.textContent!, /2 %/);
  assert.match(
    chart.container.querySelector('[aria-live]')!.textContent!,
    /0 %/
  );
});

const loadSegments = [
  {
    id: '13',
    start: 100,
    end: 120,
    label: '280',
    caption: '#13',
    description: '280 requests · Measurement #13'
  },
  {
    id: '16',
    start: 200,
    end: 260,
    label: '281',
    caption: '#16',
    description: '281 requests · Measurement #16'
  },
  {
    id: '15',
    start: 120,
    end: 150,
    label: '282',
    caption: '#15',
    description: '282 requests · Measurement #15'
  }
];
const segmentMetric = {
  ...metric,
  series: [
    {
      ...metric.series[0],
      points: [
        [100, 1],
        [110, 2],
        [120, 3],
        [130, null],
        [140, 4],
        [200, 5],
        [220, 6],
        [240, 7]
      ]
    }
  ]
};

test('load segments preserve raw values and null samples with breaks between measurements', async (t) => {
  const chart = await mount(segmentMetric, {
    timeRange: { start: 100, end: 260 },
    timeSegments: loadSegments,
    timeBands: [
      { start: 200, end: 260, label: 'Measurement #16', kind: 'selected' }
    ]
  });
  t.after(chart.unmount);
  assert.equal(options.xAxis.type, 'value');
  assert.equal(options.xAxis.min, -0.5);
  assert.equal(options.xAxis.max, 2.5);
  assert.equal(options.xAxis.axisLabel.formatter(1), '281\n#16');
  assert.deepEqual(options.xAxis.axisLabel.customValues, [0, 1, 2]);
  assert.deepEqual(
    options.series[0].data.map((p: any) => p.value[1]),
    [1, 2, null, 5, 6, 7, null, 3, null, 4, null]
  );
  assert.equal(options.series[0].connectNulls, false);
  assert.equal(options.series[0].markArea.data[0][0].xAxis, 0.56);
  assert.equal(options.series[0].markArea.data[0][1].xAxis, 1.44);
  const tip = options.tooltip.formatter([{ dataIndex: 4 }]).textContent;
  assert.match(tip, /Measurement #16/);
  assert.match(tip, /modelMonitoring.originalTime/);
  assert.match(tip, /modelMonitoring.segmentProgress/);
  assert.match(tip, /6/);
});

test('segmented keyboard navigation follows load order while publishing original timestamps', async (t) => {
  const changes = mock.fn();
  const chart = await mount(segmentMetric, {
    timeRange: { start: 100, end: 260 },
    timeSegments: loadSegments,
    interaction: { timestamp: 240, pinned: false, onChange: changes },
    exactCursor: true
  });
  t.after(chart.unmount);
  const plot = chart.container.querySelector<HTMLElement>('[tabindex="0"]')!;
  await act(async () =>
    plot.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      })
    )
  );
  assert.deepEqual(changes.mock.calls.at(-1)?.arguments, [
    { timestamp: 120, pinned: true }
  ]);
  assert.ok(
    dispatchAction.mock.calls.some(
      (call) =>
        call.arguments[0].type === 'showTip' &&
        call.arguments[0].dataIndex === 7
    )
  );
});

test('load-segment data tables retain each original sample without separator rows', async (t) => {
  const chart = await mount(segmentMetric, {
    timeRange: { start: 100, end: 260 },
    timeSegments: loadSegments
  });
  t.after(chart.unmount);
  const toggle = [...chart.container.querySelectorAll('button')].find(
    (b) => b.getAttribute('aria-label') === 'modelMonitoring.table'
  )!;
  await act(async () => toggle.click());
  const rows = [...chart.container.querySelectorAll('tbody tr')];
  assert.equal(rows.length, 8);
  assert.deepEqual(
    rows.map((r) => r.querySelector('td')!.textContent),
    ['280', '280', '281', '281', '281', '282', '282', '282']
  );
  assert.deepEqual(
    rows.map((r) => r.querySelectorAll('td')[1].textContent),
    ['#13', '#13', '#16', '#16', '#16', '#15', '#15', '#15']
  );
  assert.match(
    chart.container.querySelector('thead')!.textContent!,
    /modelMonitoring.originalTime/
  );
  assert.match(rows[6].querySelectorAll('td')[3].textContent!, /—/);
});

test('a segmented cursor targets its reordered data index without changing timestamp identity', async (t) => {
  const chart = await mount(segmentMetric, {
    timeRange: { start: 100, end: 260 },
    timeSegments: loadSegments,
    interaction: { timestamp: 220, pinned: true, onChange: mock.fn() },
    exactCursor: true
  });
  t.after(chart.unmount);
  assert.deepEqual(dispatchAction.mock.calls.at(-1)?.arguments, [
    { type: 'showTip', seriesIndex: 0, dataIndex: 4 }
  ]);
});

test('segmented pointer inspection publishes the original timestamp from its own measurement', async (t) => {
  coordinateMultiplier = 1;
  t.after(() => {
    coordinateMultiplier = 1000;
  });
  const changes = mock.fn();
  const chart = await mount(segmentMetric, {
    timeRange: { start: 100, end: 260 },
    timeSegments: loadSegments,
    interaction: { timestamp: null, pinned: false, onChange: changes },
    exactCursor: true
  });
  t.after(chart.unmount);
  const plot = chart.container.querySelector<HTMLElement>('[tabindex="0"]')!;
  await act(async () =>
    plot.dispatchEvent(
      new dom.window.MouseEvent('mousemove', { clientX: 1, bubbles: true })
    )
  );
  assert.deepEqual(changes.mock.calls.at(-1)?.arguments, [
    { timestamp: 220, pinned: false }
  ]);
});

test('segmented default legends use the selected measurement and keep missing hover values empty', async (t) => {
  const chart = await mount(segmentMetric, {
    timeRange: { start: 100, end: 260 },
    timeSegments: loadSegments,
    timeBands: [{ start: 100, end: 120, label: '#13', kind: 'selected' }]
  });
  const legend = chart.container.querySelector(
    '[aria-label="modelMonitoring.seriesLegend"]'
  )!;
  assert.match(legend.textContent!, /2\s*%/);
  assert.doesNotMatch(legend.textContent!, /7\s*%/);
  await chart.unmount();
  const missing = await mount(segmentMetric, {
    timeRange: { start: 100, end: 260 },
    timeSegments: loadSegments,
    interaction: { timestamp: 130, pinned: false, onChange: mock.fn() }
  });
  t.after(missing.unmount);
  assert.match(
    missing.container.querySelector(
      '[aria-label="modelMonitoring.seriesLegend"]'
    )!.textContent!,
    /—/
  );
});

test('one shared multi-selection updates ordinary, PD, KV and per-token latency charts and their data tables while keeping fixed Avg and non-latency charts', async () => {
  const statistics = ['avg', 'p50', 'p95', 'p99'];
  const timing = {
    ...metric,
    kind: 'histogram',
    unit: 'seconds',
    supported_statistics: statistics,
    series: statistics.map((statistic, index) => ({
      name: 'Decode',
      statistic,
      dimensions: { role: 'decode', model_instance_id: 7 },
      points: [[100, index === 0 ? 0 : index]]
    }))
  };
  const composite = {
    ...timing,
    series: ['Queue', 'Stage', 'Full'].flatMap((measure) =>
      timing.series.map((line) => ({
        ...line,
        name: `${measure} · Decode`,
        comparisonMeasure: true,
        compositionKey: `${measure}:${line.statistic}`
      }))
    )
  };
  const gateway = {
    ...timing,
    supported_statistics: ['avg'],
    series: timing.series.slice(0, 1)
  };
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(
        LatencyStatisticsProvider,
        null,
        createElement(LatencyStatisticsControl),
        ...[
          ['ttft', timing],
          ['tpot', timing],
          ['itl', timing],
          ['queue', timing],
          ['e2e', timing],
          ['prefill', timing],
          ['decode', timing],
          ['pd_kv_completion', timing],
          ['pd_request_timing', composite],
          ['ingress_ttft', gateway],
          ['gpu_utilization', metric]
        ].map(([key, source]) =>
          createElement(MetricChart, {
            key: key as string,
            metricKey: key as string,
            title: key as string,
            metric: source as any,
            measures:
              key === 'pd_request_timing' ? ['Queue', 'Stage', 'Full'] : [],
            showSummary: false
          })
        )
      )
    )
  );
  const card = (key: string) =>
    document.querySelector(`section[aria-label="${key}"]`)!;
  const legends = (key: string) =>
    card(key).querySelectorAll(
      '[aria-label="modelMonitoring.seriesLegend"] button'
    );
  const click = async (label: string) => {
    const input = document.querySelector<HTMLInputElement>(
      '[data-latency-statistics-control] input[role="combobox"]'
    )!;
    if (input.getAttribute('aria-expanded') !== 'true') {
      await act(async () =>
        input.dispatchEvent(
          new dom.window.MouseEvent('mousedown', { bubbles: true })
        )
      );
    }
    const option = [
      ...document.querySelectorAll<HTMLElement>(
        '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option'
      )
    ].find((item) => item.textContent === label);
    assert.ok(option);
    await act(async () => option.click());
  };
  assert.equal(card('ttft').getAttribute('data-latency-statistics'), 'P99');
  assert.equal(legends('pd_request_timing').length, 3);
  await act(async () =>
    (legends('pd_request_timing')[0] as HTMLButtonElement).click()
  );
  await click('Avg');
  for (const key of [
    'ttft',
    'tpot',
    'itl',
    'queue',
    'e2e',
    'prefill',
    'decode',
    'pd_kv_completion',
    'pd_request_timing'
  ]) {
    assert.equal(
      card(key).getAttribute('data-latency-statistics'),
      'Avg / P99'
    );
  }
  assert.equal(legends('pd_request_timing').length, 6);
  assert.ok(
    [...legends('pd_request_timing')].every(
      (button) => button.getAttribute('aria-pressed') === 'true'
    ),
    'a new global selection is not masked by an older chart legend filter'
  );
  assert.equal(
    card('ingress_ttft').getAttribute('data-latency-statistics'),
    'Avg'
  );
  assert.equal(legends('ingress_ttft').length, 1);
  assert.equal(
    card('gpu_utilization').getAttribute('data-latency-statistics'),
    null
  );
  await act(async () =>
    (
      card('pd_request_timing').querySelector(
        '[aria-label="modelMonitoring.table"]'
      ) as HTMLButtonElement
    ).click()
  );
  assert.equal(card('pd_request_timing').querySelectorAll('th').length, 7);
  assert.match(card('pd_request_timing').textContent!, /Avg/);
  assert.match(card('pd_request_timing').textContent!, /P99/);
  await click('P50');
  await click('P95');
  assert.equal(
    card('ttft').getAttribute('data-latency-statistics'),
    'Avg / P50 / P95 / P99'
  );
  assert.equal(card('pd_request_timing').querySelectorAll('th').length, 13);
  await click('Avg');
  await click('P50');
  await click('P95');
  await click('P99');
  assert.equal(
    card('ttft').getAttribute('data-latency-statistics'),
    'P99',
    'the last selection cannot be cleared'
  );
  await act(async () =>
    (
      card('pd_request_timing').querySelector(
        '[aria-label="modelMonitoring.chart"]'
      ) as HTMLButtonElement
    ).click()
  );
  assert.ok(
    [...legends('pd_request_timing')].every(
      (button) => button.getAttribute('aria-pressed') === 'true'
    ),
    'returning to an earlier statistic does not revive an old legend filter'
  );
  await act(async () => root.unmount());
});
