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
mock.module('@gpustack/core-ui/charts', {
  namedExports: {
    echarts: { use() {} },
    Chart: forwardRef((props: any, ref) => {
      options = props.options;
      useImperativeHandle(ref, () => ({ chart: { dispatchAction } }));
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
  namedExports: { AriaComponent: {}, MarkPointComponent: {} }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module(new URL('../metric-chart.module.less', import.meta.url).href, {
  defaultExport: {}
});
const { createRoot } = await import('react-dom/client');
const { default: MetricChart } = await import('../metric-chart');
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
const mount = async (source = metric) => {
  dispatchAction.mock.resetCalls();
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  await act(async () =>
    root.render(
      createElement(MetricChart, {
        title: 'GPU',
        metricKey: 'gpu_utilization',
        metric: source
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
            metric: source
          })
        )
      ),
    unmount: () => act(async () => root.unmount())
  };
};

for (const [status, reason] of [
  ['unsupported', 'metric_not_provided'],
  ['no_observations', 'zero_observations'],
  ['restricted', null],
  ['query_error', 'query_failed']
]) {
  test(`table view keeps the reason for ${status}`, async (t) => {
    const chart = await mount({ ...metric, status, reason, series: [] });
    t.after(chart.unmount);
    const toggle = [...chart.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'modelMonitoring.table'
    )!;
    await act(async () => toggle.click());
    assert.ok(chart.container.querySelector('table'));
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

test('an empty table explains missing observations before its rows of gaps', async (t) => {
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
    (button) => button.textContent === 'modelMonitoring.table'
  )!;
  await act(async () => toggle.click());
  const empty = chart.container.querySelector('.ant-empty')!;
  const table = chart.container.querySelector('table')!;
  assert.ok(
    empty.compareDocumentPosition(table) &
      dom.window.Node.DOCUMENT_POSITION_FOLLOWING
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
      .querySelectorAll<HTMLButtonElement>('button[aria-pressed]')[1]
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
    'button[aria-pressed]'
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
      'button[aria-pressed]'
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
      .querySelectorAll<HTMLButtonElement>('button[aria-pressed]')[1]
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
      .querySelectorAll<HTMLButtonElement>('button[aria-pressed]')[0]
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
    'button[aria-pressed]'
  );
  await act(async () => items[1].click());
  assert.ok(
    chart.container.textContent?.includes(
      'modelMonitoring.selectedSeriesNoSamples'
    )
  );
  await act(async () => items[0].click());
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
    'button[aria-pressed]'
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
