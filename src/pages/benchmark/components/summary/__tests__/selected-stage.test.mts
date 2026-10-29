import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
const element = ({ children }: any) => createElement('div', null, children);
const empty = () => null;
mock.module('@gpustack/core-ui', { namedExports: { SectionTitle: element } });
mock.module('@ant-design/icons', {
  namedExports: { DownOutlined: empty, RightOutlined: empty }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({
      styles: {},
      cx: (...names: string[]) => names.join(' ')
    })
  }
});
mock.module('antd', { namedExports: { Button: element } });
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => translations[id] || id })
  }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    loadValueDecimals: (d: any) => (d.load_type === 'concurrency' ? 0 : 2)
  }
});
let detail: any = {};
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  { namedExports: { useDetailContext: () => ({ detailData: detail }) } }
);
mock.module(new URL('../metrics-result.tsx', import.meta.url).href, {
  defaultExport: ({ data }: any) =>
    createElement(
      'span',
      { id: 'stage-data' },
      `${data.rate}: ${data.tokens_per_second_mean}`
    )
});
const { default: SelectedStage } = await import('../selected-stage');
const { buildStagePoints } = await import('../metrics');

const render = (
  slo: boolean,
  peak: boolean,
  healthy = true,
  profile = 'Meet Latency SLO'
) => {
  detail = {
    profile,
    load_type: profile === 'Max Throughput' ? 'fixed_rate' : 'concurrency',
    auto_tune: profile !== 'Custom',
    ...(slo ? { slo_avg_ttft_ms: 500 } : {})
  };
  const rows = [
    {
      id: 1,
      sequence: 0,
      rate: 32,
      request_total: 100,
      request_successful: healthy ? 100 : 90,
      request_errored: healthy ? 0 : 10,
      tokens_per_second_mean: 10000,
      output_tokens_per_second_mean: 1500,
      time_to_first_token_mean: 100
    }
  ];
  const point = buildStagePoints(rows as any, {
    recommendedRate: 32,
    peakRate: peak ? 32 : 64,
    sloTargets: slo ? { slo_avg_ttft_ms: 500 } : undefined
  })[0];
  return new JSDOM(
    renderToStaticMarkup(createElement(SelectedStage, { point }))
  );
};

for (const profile of ['Max Throughput', 'Custom']) {
  test(`${profile}: non-SLO primary and peak show one Peak Throughput badge without SLO Capacity`, () => {
    const dom = render(false, true, true, profile);
    const header =
      dom.window.document.querySelector('.panel-head')?.textContent || '';
    assert.equal(header.match(/Peak Throughput/g)?.length, 1);
    assert.doesNotMatch(header, /Show percentiles|Hide percentiles/);
    assert.doesNotMatch(header, /SLO Capacity/);
    assert.match(
      header,
      profile === 'Max Throughput' ? /32 req\/s/ : /32 conc\./
    );
    assert.equal(
      dom.window.document.getElementById('stage-data')?.textContent,
      '32: 10000'
    );
    dom.window.close();
  });
}

test('selected SLO capacity without a peak has only the capacity fact', () => {
  const dom = render(true, false);
  const header =
    dom.window.document.querySelector('.panel-head')?.textContent || '';
  assert.equal(header.match(/SLO Capacity/g)?.length, 1);
  assert.doesNotMatch(header, /Peak Throughput/);
  dom.window.close();
});

test('coincident selected SLO capacity and peak retain both distinct facts', () => {
  const dom = render(true, true);
  const header =
    dom.window.document.querySelector('.panel-head')?.textContent || '';
  assert.equal(header.match(/SLO Capacity/g)?.length, 1);
  assert.equal(header.match(/Peak Throughput/g)?.length, 1);
  dom.window.close();
});

test('request overload remains visible independently of the selected peak', () => {
  const dom = render(false, true, false, 'Max Throughput');
  const header =
    dom.window.document.querySelector('.panel-head')?.textContent || '';
  assert.equal(header.match(/Peak Throughput/g)?.length, 1);
  assert.equal(header.match(/Overloaded/g)?.length, 1);
  assert.doesNotMatch(header, /SLO Capacity/);
  dom.window.close();
});

test('an overloaded SLO primary retains its peak and health facts without a capacity badge', () => {
  const dom = render(true, true, false);
  const header =
    dom.window.document.querySelector('.panel-head')?.textContent || '';
  assert.doesNotMatch(header, /SLO Capacity/);
  assert.match(header, /Peak Throughput/);
  assert.match(header, /Overloaded/);
  dom.window.close();
});
