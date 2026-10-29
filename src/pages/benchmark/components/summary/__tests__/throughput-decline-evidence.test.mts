import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/zh-CN/benchmark';

const translations = (messages as any).default ?? messages;
let tooltipProps: any[] = [];
mock.module('antd', {
  namedExports: {
    Alert: ({ title, description }: any) =>
      createElement('section', { role: 'alert' }, title, description),
    Button: ({ children, ...props }: any) =>
      createElement('button', { ...props, type: 'button' }, children),
    Tooltip: (props: any) => {
      tooltipProps.push(props);
      return createElement('span', null, props.children);
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any = {}) =>
        Object.entries(values).reduce(
          (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
          translations[id] || id
        )
    })
  }
});
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: {} }
});
const detail: any = { load_type: 'concurrency' };
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  { namedExports: { useDetailContext: () => ({ detailData: detail }) } }
);
const { default: ValidityAlert } = await import('../validity-alert');
const evidence = () => ({
  threshold_percent: 15,
  consecutive_points: 2,
  peak_rate: 64,
  peak_total_tps: 10000,
  points: [
    { rate: 128, total_tps: 8200, drop_percent: 18 },
    { rate: 256, total_tps: 8000, drop_percent: 20 }
  ]
});
const reset = () => {
  tooltipProps = [];
  detail.load_type = 'concurrency';
  detail.recommended_rate = 256;
  detail.validity = {
    coverage_applicable: true,
    stop_reason: 'throughput_decline',
    slo_boundary_located: false,
    throughput_decline: evidence(),
    warnings: [
      { code: 'throughput_decline', params: { points: 2, threshold: 15 } }
    ]
  };
};
const render = () =>
  new JSDOM(renderToStaticMarkup(createElement(ValidityAlert)));

test('actual warning shows recorded rule parameters without repeating the main capacity and exposes hover/focus evidence', () => {
  reset();
  const dom = render();
  const body = dom.window.document.querySelector('li')?.textContent || '';
  assert.match(
    body,
    /连续 2 个递增负载档位的总 TPS 均较已测峰值下降至少 15%，测试提前结束。SLO 边界尚未定位。/
  );
  assert.doesNotMatch(body, /最高已测|256/);
  assert.equal(tooltipProps.length, 1);
  assert.deepEqual(tooltipProps[0].trigger, ['hover', 'focus']);
  const button = dom.window.document.querySelector('button')!;
  assert.ok(button);
  assert.ok(button.getAttribute('aria-label'));
  const title = renderToStaticMarkup(tooltipProps[0].title);
  assert.match(title, /已测峰值：10,000 tok\/s/);
  assert.match(title, /并发 128：8,200 tok\/s（下降 18%）/);
  assert.match(title, /并发 256：8,000 tok\/s（下降 20%）/);
  dom.window.close();
});

test('rule copy uses actual dynamic count and threshold instead of fixed15/2 policy', () => {
  reset();
  detail.validity.throughput_decline = {
    ...evidence(),
    threshold_percent: 10,
    consecutive_points: 3,
    points: [
      { rate: 128, total_tps: 8800, drop_percent: 12 },
      { rate: 256, total_tps: 8700, drop_percent: 13 },
      { rate: 512, total_tps: 8500, drop_percent: 15 }
    ]
  };
  detail.validity.warnings[0].params = { points: 3, threshold: 10 };
  const dom = render();
  const body = dom.window.document.querySelector('li')?.textContent || '';
  assert.match(body, /连续 3 个.*至少 10%/);
  assert.doesNotMatch(body, /连续 2 个|至少 15%/);
  assert.equal(tooltipProps.length, 1);
  dom.window.close();
});

test('configured rate-axis evidence uses req/s and recorded drop values without recomputing', () => {
  reset();
  detail.load_type = 'fixed_rate';
  detail.validity.throughput_decline.peak_rate = 0.125;
  detail.validity.throughput_decline.points[0] = {
    rate: 0.25,
    total_tps: 8200,
    drop_percent: 18.7
  };
  detail.validity.throughput_decline.points[1].rate = 0.5;
  const dom = render();
  assert.equal(tooltipProps.length, 1);
  const title = renderToStaticMarkup(tooltipProps[0].title);
  assert.match(title, /目标请求率 0.25 req\/s：8,200 tok\/s（下降 18.7%）/);
  assert.doesNotMatch(title, /并发/);
  dom.window.close();
});

test('missing evidence renders generic truthful copy without fabricated policy or a details control', () => {
  reset();
  delete detail.validity.throughput_decline;
  detail.validity.warnings[0].params = {};
  const dom = render();
  const body = dom.window.document.querySelector('li')?.textContent || '';
  assert.match(body, /总 TPS 持续下降，测试提前结束。SLO 边界尚未定位。/);
  assert.doesNotMatch(body, /15%|连续 2|最高已测/);
  assert.equal(tooltipProps.length, 0);
  assert.equal(dom.window.document.querySelector('button'), null);
  dom.window.close();
});

test('malformed evidence or mismatched rule parameters never expose fabricated details', () => {
  const invalid = [
    null,
    { ...evidence(), peak_total_tps: 0 },
    { ...evidence(), threshold_percent: NaN },
    { ...evidence(), consecutive_points: 3 },
    {
      ...evidence(),
      points: [
        { rate: 128, total_tps: 12000, drop_percent: 18 },
        { rate: 256, total_tps: 8000, drop_percent: 20 }
      ]
    },
    {
      ...evidence(),
      points: [
        { rate: 128, total_tps: '8200', drop_percent: 18 },
        { rate: 256, total_tps: 8000, drop_percent: 20 }
      ]
    },
    {
      ...evidence(),
      points: [
        { rate: 256, total_tps: 8200, drop_percent: 18 },
        { rate: 128, total_tps: 8000, drop_percent: 20 }
      ]
    }
  ];
  for (const item of invalid) {
    reset();
    detail.validity.throughput_decline = item;
    const dom = render();
    assert.equal(tooltipProps.length, 0);
    assert.equal(dom.window.document.querySelector('button'), null);
    assert.doesNotMatch(
      dom.window.document.querySelector('li')?.textContent || '',
      /连续 2 个|15%/
    );
    dom.window.close();
  }
  reset();
  detail.validity.warnings[0].params = { points: 3, threshold: 20 };
  const dom = render();
  assert.equal(tooltipProps.length, 0);
  assert.doesNotMatch(
    dom.window.document.querySelector('li')?.textContent || '',
    /连续 3|20%/
  );
  dom.window.close();
});
