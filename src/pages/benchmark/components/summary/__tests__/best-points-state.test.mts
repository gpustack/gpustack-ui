import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const element = ({ children, className, ...props }: any) =>
  createElement(
    'div',
    {
      className,
      ...Object.fromEntries(
        Object.entries(props).filter(([key]) => key.startsWith('data-'))
      )
    },
    children
  );
mock.module('@gpustack/core-ui', {
  namedExports: { SectionTitle: element }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('antd', {
  namedExports: {
    Flex: element,
    Tooltip: ({ children }: any) => children,
    Button: ({ children }: any) => createElement('button', null, children)
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    loadAxisLabelId: (record: any) =>
      record.load_type === 'concurrency'
        ? 'benchmark.form.concurrency'
        : 'benchmark.table.requestRate'
  }
});
let detail: any;
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  { namedExports: { useDetailContext: () => ({ detailData: detail }) } }
);
const { buildStagePoints } = await import('../metrics');
const { default: BestPoints } = await import('../best-points');
const rows = [
  {
    id: 1,
    sequence: 0,
    input_tokens: 128,
    rate: 4,
    request_total: 100,
    request_successful: 100,
    tokens_per_second_mean: 2000,
    time_to_first_token_mean: 100,
    inter_token_latency_mean: 10
  },
  {
    id: 2,
    sequence: 1,
    input_tokens: 128,
    rate: 8,
    request_total: 100,
    request_successful: 100,
    tokens_per_second_mean: 3000,
    time_to_first_token_mean: 200,
    inter_token_latency_mean: 20
  }
] as any[];
const render = () =>
  renderToStaticMarkup(
    createElement(BestPoints, {
      points: buildStagePoints(rows, {
        primaryPoint: detail.validity?.primary_point,
        recommendedRate: detail.recommended_rate,
        sloTargets: detail
      }),
      onSelect() {}
    })
  );
const record = (slo: boolean) => ({
  auto_tune: true,
  load_type: slo ? 'concurrency' : 'fixed_rate',
  recommended_rate: 8,
  ...(slo ? { slo_avg_ttft_ms: 500 } : {}),
  validity: {
    primary_point: { input_tokens: 128, sequence: 1, rate: 8 }
  }
});

for (const slo of [false, true]) {
  test(`${slo ? 'SLO capacity' : 'peak throughput'} is not presented as final during a partial sync`, () => {
    detail = {
      ...record(slo),
      validity: { ...record(slo).validity, in_progress: true }
    };
    const html = render();
    assert.match(html, /benchmark\.detail\.result\.currentMeasured/);
    assert.match(html, slo ? /class="v">8</ : /class="v">3,000</);
    assert.doesNotMatch(
      html,
      /benchmark\.detail\.result\.(totalPeak|sloConcurrency)/
    );
    assert.doesNotMatch(
      html,
      /slo-boundary|benchmark\.detail\.slo\.(allMeasuredPassed|noHigherBreach)/
    );
  });

  test(`${slo ? 'SLO capacity' : 'peak throughput'} is not presented as final on a legacy running row`, () => {
    detail = { ...record(slo), state: 'running' };
    const html = render();
    assert.match(html, /benchmark\.detail\.result\.currentMeasured/);
    assert.match(html, slo ? /class="v">8</ : /class="v">3,000</);
    assert.doesNotMatch(html, /slo-boundary/);
  });

  for (const state of ['completed', 'stopped', 'error']) {
    test(`${state} preserves the stored ${slo ? 'SLO capacity' : 'peak throughput'} conclusion`, () => {
      detail = { ...record(slo), state };
      assert.match(
        render(),
        slo
          ? /benchmark\.detail\.result\.sloConcurrency/
          : /benchmark\.detail\.result\.totalPeak/
      );
    });
  }
}

test('a current primary measurement remains visible even when it does not meet the SLO', () => {
  detail = { ...record(true), state: 'running', slo_avg_ttft_ms: 50 };
  const html = render();
  assert.match(html, /benchmark\.detail\.result\.currentMeasured/);
  assert.match(html, /class="statistic-value">200</);
  assert.doesNotMatch(
    html,
    /benchmark\.detail\.result\.sloConcurrency|slo-boundary/
  );
});

test('an unfinished SLO search does not conclude that no measured point passed', () => {
  detail = {
    ...record(true),
    recommended_rate: null,
    validity: { primary_point: null, in_progress: true }
  };
  assert.equal(render(), '');
});
