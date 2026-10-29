import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/zh-CN/benchmark';

const translations = (messages as any).default ?? messages;
const empty = () => null;
const element = ({ children }: any) => createElement('div', null, children);
let tooltips: any[] = [];
mock.module('@gpustack/core-ui', { namedExports: { SectionTitle: element } });
mock.module('@ant-design/icons', {
  namedExports: {
    CheckCircleFilled: empty,
    DownOutlined: empty,
    QuestionCircleOutlined: empty,
    RightOutlined: empty,
    WarningOutlined: empty
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({
      styles: {},
      cx: (...names: string[]) => names.join(' ')
    })
  }
});
mock.module('antd', {
  namedExports: {
    Button: empty,
    Flex: element,
    Table: empty,
    Tooltip: (props: any) => {
      tooltips.push(props);
      return createElement('span', null, props.children);
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any = {}) =>
        Object.entries(values).reduce(
          (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
          translations[id] || id
        )
    })
  }
});
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: {} }
});
const detail: any = {};
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  { namedExports: { useDetailContext: () => ({ detailData: detail }) } }
);
mock.module(new URL('../chart-specs.ts', import.meta.url).href, {
  namedExports: { RESIDENT_CHARTS: 0, buildChartSpecs: () => [] }
});
mock.module(new URL('../load-sweep.tsx', import.meta.url).href, {
  defaultExport: empty
});
mock.module(new URL('../../echarts.ts', import.meta.url).href, {
  defaultExport: {}
});

const { default: Overview } = await import('../overview');
const { buildStagePoints } = await import('../metrics');
const evidence = () => ({
  threshold_percent: 1,
  window_points: 3,
  baseline_rate: 40,
  baseline_total_tps: 10000,
  best_rate: 42,
  best_total_tps: 10070,
  gain_percent: 0.7,
  lower_rate: 41,
  upper_rate: 44,
  points: [
    { rate: 44, total_tps: 10030, best_total_tps: 10030 },
    { rate: 42, total_tps: 10070, best_total_tps: 10070 },
    { rate: 43, total_tps: 10040, best_total_tps: 10070 }
  ]
});
const reset = () => {
  tooltips = [];
  Object.assign(detail, {
    load_type: 'fixed_rate',
    auto_tune: true,
    validity: {
      stop_reason: 'throughput_gain_converged',
      sufficient: true,
      warnings: [],
      throughput_gain_evidence: evidence()
    }
  });
};
const render = () => {
  const points = buildStagePoints(
    [
      { id: 1, rate: 40, tokens_per_second_mean: 10000 },
      { id: 2, rate: 42, tokens_per_second_mean: 10070 }
    ] as any,
    { recommendedRate: 42, peakRate: 42, isConcurrency: false }
  );
  return new JSDOM(
    renderToStaticMarkup(
      createElement(Overview, { points, probes: [], onSelect: empty })
    )
  );
};
const evidenceTooltips = () =>
  tooltips.filter((props) =>
    renderToStaticMarkup(createElement('div', null, props.title)).includes(
      '最近'
    )
  );

test('normal throughput-gain convergence has a formal stop label and recorded hover/focus evidence', () => {
  reset();
  const dom = render();
  assert.match(
    dom.window.document.querySelector('.stop-reason')?.textContent || '',
    /吞吐收益收敛/
  );
  const tips = evidenceTooltips();
  assert.equal(tips.length, 1);
  assert.deepEqual(tips[0].trigger, ['hover', 'focus']);
  const title = renderToStaticMarkup(tips[0].title);
  assert.match(title, /最近 3 个细搜点/);
  assert.match(title, /累计提升 0.70%/);
  assert.match(title, /低于 1% 阈值/);
  for (const value of [
    '10,000',
    '10,030',
    '10,070',
    '10,040',
    '44',
    '42',
    '43'
  ])
    assert.ok(title.includes(value), value);
  assert.doesNotMatch(title, /全局峰值已定位|预算用尽|覆盖不足/);
  const trigger = dom.window.document.querySelector('.stop-reason [tabindex]');
  assert.equal(trigger?.getAttribute('tabindex'), '0');
  dom.window.close();
});

test('the explanation uses the recorded window, threshold and gain without assuming the current policy', () => {
  reset();
  const row = evidence();
  detail.validity.throughput_gain_evidence = {
    ...row,
    threshold_percent: 0.9,
    window_points: 2,
    gain_percent: 0.63,
    points: row.points.slice(1)
  };
  const dom = render();
  const title = renderToStaticMarkup(evidenceTooltips()[0]?.title);
  assert.match(title, /最近 2 个细搜点/);
  assert.match(title, /累计提升 0.63%/);
  assert.match(title, /低于 0.9% 阈值/);
  dom.window.close();
});

test('missing or malformed convergence evidence only shows the generic stop label', () => {
  const invalid = [
    undefined,
    null,
    { ...evidence(), window_points: 4 },
    { ...evidence(), gain_percent: NaN },
    { ...evidence(), threshold_percent: 0 },
    { ...evidence(), baseline_total_tps: 0 },
    { ...evidence(), points: [{ rate: 1, total_tps: 2, best_total_tps: 3 }] }
  ];
  for (const value of invalid) {
    reset();
    detail.validity.throughput_gain_evidence = value;
    const dom = render();
    const text =
      dom.window.document.querySelector('.stop-reason')?.textContent || '';
    assert.match(text, /吞吐收益收敛/);
    assert.doesNotMatch(text, /0.70|1%|3 个|undefined|\{.*\}/);
    assert.equal(evidenceTooltips().length, 0);
    dom.window.close();
  }
});

test('inconsistent refinement intervals and cumulative best records do not expose evidence', () => {
  const invalid = [
    { ...evidence(), lower_rate: 42 },
    { ...evidence(), upper_rate: 42 },
    {
      ...evidence(),
      points: [
        { rate: 44, total_tps: 0, best_total_tps: 10030 },
        ...evidence().points.slice(1)
      ]
    },
    {
      ...evidence(),
      points: [
        { rate: 44, total_tps: 9900, best_total_tps: 9950 },
        ...evidence().points.slice(1)
      ]
    },
    {
      ...evidence(),
      points: [
        { rate: 44, total_tps: 10030, best_total_tps: 10080 },
        ...evidence().points.slice(1)
      ]
    },
    {
      ...evidence(),
      points: [
        { rate: 44, total_tps: 10030, best_total_tps: 10070 },
        { rate: 42, total_tps: 10050, best_total_tps: 10060 },
        evidence().points[2]
      ]
    },
    {
      ...evidence(),
      points: [
        ...evidence().points.slice(0, 2),
        { rate: 43, total_tps: 10040, best_total_tps: 10060 }
      ]
    }
  ];
  for (const value of invalid) {
    reset();
    detail.validity.throughput_gain_evidence = value;
    const dom = render();
    assert.match(
      dom.window.document.querySelector('.stop-reason')?.textContent || '',
      /吞吐收益收敛/
    );
    assert.equal(evidenceTooltips().length, 0);
    dom.window.close();
  }
});

test('recorded gain close to the threshold is not rounded into a contradictory equality', () => {
  reset();
  detail.validity.throughput_gain_evidence = {
    ...evidence(),
    best_total_tps: 10099.6,
    gain_percent: 0.996,
    points: [
      evidence().points[0],
      { rate: 42, total_tps: 10099.6, best_total_tps: 10099.6 },
      { rate: 43, total_tps: 10040, best_total_tps: 10099.6 }
    ]
  };
  const dom = render();
  const title = renderToStaticMarkup(evidenceTooltips()[0]?.title);
  assert.match(title, /累计提升 0.996%/);
  assert.match(title, /低于 1% 阈值/);
  assert.doesNotMatch(title, /累计提升 1.00%/);
  dom.window.close();
});

test('other stop reasons do not display stale gain evidence and running snapshots have no stop conclusion', () => {
  reset();
  detail.validity.stop_reason = 'budget_points';
  let dom = render();
  assert.match(
    dom.window.document.querySelector('.stop-reason')?.textContent || '',
    /点数预算用尽/
  );
  assert.equal(evidenceTooltips().length, 0);
  dom.window.close();
  reset();
  detail.validity.in_progress = true;
  dom = render();
  assert.equal(dom.window.document.querySelector('.stop-reason'), null);
  assert.equal(evidenceTooltips().length, 0);
  dom.window.close();
});
