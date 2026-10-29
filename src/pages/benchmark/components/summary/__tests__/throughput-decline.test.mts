import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { cloneElement, createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
const element = ({ children }: any) => createElement('div', null, children);
mock.module('@gpustack/core-ui', { namedExports: { SectionTitle: element } });
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('antd', {
  namedExports: {
    Flex: element,
    Tooltip: element,
    Button: element,
    Alert: ({ title, description }: any) =>
      createElement('section', { role: 'alert' }, title, description)
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any = {}) => {
        let parts: any[] = [translations[id] || id];
        for (const [key, value] of Object.entries(values))
          parts = parts.flatMap((part) =>
            typeof part === 'string'
              ? part
                  .split(`{${key}}`)
                  .flatMap((text, index) =>
                    index
                      ? [
                          isValidElement(value)
                            ? cloneElement(value, { key: `${key}-${index}` })
                            : String(value),
                          text
                        ]
                      : [text]
                  )
              : [part]
          );
        return parts.every((p) => typeof p === 'string')
          ? parts.join('')
          : parts;
      }
    })
  }
});
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: {} }
});
const detail: any = {
  auto_tune: true,
  load_type: 'concurrency',
  recommended_rate: 512,
  slo_met_rate: 512,
  peak_rate: 128,
  slo_avg_ttft_ms: 500,
  validity: {
    coverage_applicable: true,
    sufficient: false,
    stop_reason: 'throughput_decline',
    slo_boundary_located: false,
    primary_point: { input_tokens: null, sequence: 2, rate: 512 },
    peak_point: { input_tokens: null, sequence: 0, rate: 128 },
    warnings: [{ code: 'throughput_decline', params: {} }]
  }
};
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  {
    namedExports: { useDetailContext: () => ({ detailData: detail }) }
  }
);
const { VALIDITY_MESSAGE_KEY, STOP_REASON_LABEL } =
  await import('../../../config');
const { default: ValidityAlert } = await import('../validity-alert');
const { default: PrimaryResult } = await import('../best-points');
const { buildStagePoints } = await import('../metrics');

test('sustained total-throughput decline renders a protective-stop warning without claiming an SLO boundary', () => {
  const html = renderToStaticMarkup(createElement(ValidityAlert));
  assert.match(html, /role="alert"/);
  assert.match(html, /ended early/);
  assert.match(html, /sustained decline in total TPS/);
  assert.doesNotMatch(
    html,
    /highest measured load that met the SLO|15%|2 consecutive/
  );
  assert.match(html, /SLO boundary has not been located/);
  assert.equal(
    VALIDITY_MESSAGE_KEY.throughput_decline,
    'benchmark.detail.validity.throughputDecline'
  );
  assert.equal(
    translations[STOP_REASON_LABEL.throughput_decline],
    'Throughput decline guard'
  );
});

test('protective stopping retains the latest passing load as primary despite lower throughput', () => {
  const rows = [
    { rate: 128, total: 28000, output: 14000, ttft: 200 },
    { rate: 256, total: 23000, output: 15000, ttft: 300 },
    { rate: 512, total: 22600, output: 16000, ttft: 450 }
  ].map((p, sequence) => ({
    id: sequence,
    sequence,
    rate: p.rate,
    request_total: 100,
    request_successful: 100,
    output_tokens_per_second_mean: p.output,
    tokens_per_second_mean: p.total,
    time_to_first_token_mean: p.ttft,
    time_to_first_token_p99: p.ttft * 2,
    inter_token_latency_mean: 6
  })) as any;
  const points = buildStagePoints(rows, {
    recommendedRate: detail.recommended_rate,
    peakRate: detail.peak_rate,
    primaryPoint: detail.validity.primary_point,
    peakPoint: detail.validity.peak_point,
    sloTargets: detail,
    isConcurrency: true
  });
  assert.equal(points.find((p) => p.isBest)?.load, 512);
  assert.equal(points.find((p) => p.isPeak)?.load, 128);
  const html = renderToStaticMarkup(
    createElement(PrimaryResult, { points, onSelect: () => {} })
  );
  assert.match(html, /Highest measured concurrency meeting SLO/);
  assert.match(html, /512/);
  assert.match(html, /Peak at.*128/);
  assert.match(html, /class="improvement">-56%/);
  assert.doesNotMatch(html, /SLO capacity/);
  assert.match(html, /ITL p99/);
  assert.doesNotMatch(html, /SLO boundary located/);
});
