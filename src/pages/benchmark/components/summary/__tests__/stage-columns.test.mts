import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
let tooltipProps: any[] = [];
let sweepProps: any;
const element = ({ children }: any) => createElement('div', null, children);
const empty = () => null;
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
      cx: (...x: string[]) => x.join(' ')
    })
  }
});
mock.module('antd', {
  namedExports: {
    Button: empty,
    Flex: element,
    Tooltip: (props: any) => {
      tooltipProps.push(props);
      return createElement(
        'span',
        { 'data-tooltip': props.title },
        props.children
      );
    },
    Table: ({ columns, dataSource }: any) =>
      createElement(
        'table',
        null,
        createElement(
          'thead',
          null,
          createElement(
            'tr',
            null,
            columns.map((c: any) =>
              createElement('th', { key: c.key, 'data-column': c.key }, c.title)
            )
          )
        ),
        createElement(
          'tbody',
          null,
          dataSource.map((r: any) =>
            createElement(
              'tr',
              { key: r.id },
              columns.map((c: any) =>
                createElement(
                  'td',
                  { key: c.key, 'data-column': c.key },
                  c.render(undefined, r)
                )
              )
            )
          )
        )
      )
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
let detail: any = {};
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  { namedExports: { useDetailContext: () => ({ detailData: detail }) } }
);
mock.module(new URL('../chart-specs.ts', import.meta.url).href, {
  namedExports: { RESIDENT_CHARTS: 0, buildChartSpecs: () => [] }
});
mock.module(new URL('../load-sweep.tsx', import.meta.url).href, {
  defaultExport: (props: any) => {
    sweepProps = props;
    return null;
  }
});
mock.module(new URL('../../echarts.ts', import.meta.url).href, {
  defaultExport: {}
});
const { default: Overview } = await import('../overview');
const { buildStagePoints, buildProbePoints } = await import('../metrics');
const { stageLatencyValue } =
  await import('../../../utils/stage-detail-metrics');

test('stage marker explanations support focus as well as hover', () => {
  detail = { load_type: 'concurrency', slo_avg_ttft_ms: 500 };
  const points = buildStagePoints(
    [
      {
        id: 1,
        rate: 16,
        sequence: 0,
        request_total: 100,
        request_successful: 100,
        time_to_first_token_mean: 100,
        tokens_per_second_mean: 10000
      },
      {
        id: 2,
        rate: 32,
        sequence: 1,
        request_total: 100,
        request_successful: 100,
        time_to_first_token_mean: 200,
        tokens_per_second_mean: 11000
      }
    ] as any,
    { recommendedRate: 16, peakRate: 32, sloTargets: detail }
  );
  tooltipProps = [];
  renderToStaticMarkup(
    createElement(Overview, { points, probes: [], onSelect: () => {} })
  );
  for (const id of [
    'benchmark.detail.marker.sloCapacity.tip',
    'benchmark.detail.marker.peakThroughput.tip'
  ]) {
    const tooltip = tooltipProps.find(
      (props) => props.title === translations[id]
    );
    assert.ok(tooltip);
    assert.deepEqual(tooltip.trigger, ['hover', 'focus']);
    assert.equal(tooltip.children.props.tabIndex, 0);
  }
  assert.equal(sweepProps.labels.ttftP99, 'TTFT Avg');
});

for (const { name, fields, expected } of [
  {
    name: 'running flat-only decode statistics',
    fields: { inter_token_latency_p99: 4.42 },
    expected: 4.42
  },
  {
    name: 'flat non-incremental response fallback',
    fields: { inter_token_latency_p99: 0, time_per_output_token_p99: 4.42 },
    expected: 4.42
  },
  {
    name: 'recorded flat statistic takes precedence',
    fields: {
      inter_token_latency_p99: 4.42,
      raw_metrics: {
        metrics: {
          inter_token_latency_ms: {
            successful: { count: 240, percentiles: { p99: 5.5 } }
          }
        }
      }
    },
    expected: 4.42
  },
  {
    name: 'raw-only legacy distribution',
    fields: {
      raw_metrics: {
        metrics: {
          inter_token_latency_ms: {
            successful: { count: 240, percentiles: { p99: 4.42 } }
          }
        }
      }
    },
    expected: 4.42
  },
  {
    name: 'no successful samples',
    fields: {
      inter_token_latency_p99: 4.42,
      raw_metrics: {
        metrics: { inter_token_latency_ms: { successful: { count: 0 } } }
      }
    },
    expected: null
  },
  { name: 'unknown distribution', fields: {}, expected: null }
]) {
  test(`TPOT p99 agrees between the stage table and detail for ${name}`, () => {
    detail = { profile: 'Max Throughput', load_type: 'fixed_rate' };
    const row = {
      id: 1,
      sequence: 0,
      rate: 8,
      request_total: 240,
      request_successful: 240,
      ...fields
    } as any;
    const points = buildStagePoints(
      [row, { ...row, id: 2, sequence: 1, rate: 16 }],
      {}
    );
    assert.equal(points[0].tpotP99, expected);
    assert.equal(stageLatencyValue(row, 'tpot', 'p99'), expected);
    assert.equal(
      buildProbePoints([{ ...row, rate: null }])[0].tpotP99,
      expected
    );
    const dom = new JSDOM(
      renderToStaticMarkup(
        createElement(Overview, { points, probes: [], onSelect: () => {} })
      )
    );
    assert.equal(
      dom.window.document.querySelector('tbody [data-column="tpotP99"]')
        ?.textContent,
      expected == null ? '-' : String(expected)
    );
    dom.window.close();
  });
}

for (const { axis, profile } of [
  { axis: 'concurrency', profile: 'Max Throughput' },
  { axis: 'fixed_rate', profile: 'Max Throughput' },
  { axis: 'concurrency', profile: 'Meet Latency SLO' },
  { axis: 'fixed_rate', profile: 'Meet Latency SLO' }
]) {
  test(`${profile}/${axis}: configured load, measured request rate and measured concurrency remain distinct`, () => {
    detail = { load_type: axis, auto_tune: false, profile };
    const rows = [
      {
        id: 1,
        sequence: 0,
        rate: 64,
        requests_per_second_mean: 47.258,
        request_concurrency_mean: 13.375,
        request_total: 1000,
        request_successful: 1000,
        tokens_per_second_mean: 10000,
        input_tokens_per_second_mean: 8500,
        output_tokens_per_second_mean: 1500,
        raw_metrics: { duration: 10 }
      },
      {
        id: 2,
        sequence: 1,
        rate: 128,
        requests_per_second_mean: null,
        request_concurrency_mean: null,
        request_total: 1000,
        request_successful: 1000,
        tokens_per_second_mean: 12000,
        input_tokens_per_second_mean: 10000,
        output_tokens_per_second_mean: 2000,
        raw_metrics: { duration: 10 }
      }
    ] as any;
    const points = buildStagePoints(rows, {
      isConcurrency: axis === 'concurrency'
    });
    const html = renderToStaticMarkup(
      createElement(Overview, { points, probes: [], onSelect: () => {} })
    );
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const columnKeys = [...doc.querySelectorAll('th[data-column]')].map((n) =>
      n.getAttribute('data-column')
    );
    assert.deepEqual(
      columnKeys.slice(0, 3),
      profile === 'Max Throughput'
        ? ['rate', 'achievedRate', 'conc']
        : ['rate', 'conc', 'achievedRate']
    );
    assert.equal(doc.querySelector('th[data-column="tpot"]'), null);
    assert.ok(doc.querySelector('th[data-column="tpotP99"]'));
    assert.ok(doc.querySelector('th[data-column="itlP99"]'));
    const firstRow = doc.querySelectorAll('tbody tr')[0];
    const secondRow = doc.querySelectorAll('tbody tr')[1];
    assert.match(
      doc.querySelector('th[data-column="rate"]')?.textContent || '',
      axis === 'concurrency' ? /Target concurrency/ : /Target request rate/
    );
    assert.match(
      doc.querySelector('th[data-column="achievedRate"]')?.textContent || '',
      /Achieved request rate Avg.*req\/s/
    );
    assert.match(
      doc.querySelector('th[data-column="conc"]')?.textContent || '',
      /Achieved concurrency Avg/
    );
    assert.match(
      doc
        .querySelector('th[data-column="achievedRate"] [data-tooltip]')
        ?.getAttribute('data-tooltip') || '',
      /successful request completions.*not the configured arrival rate/
    );
    assert.match(
      doc
        .querySelector('th[data-column="conc"] [data-tooltip]')
        ?.getAttribute('data-tooltip') || '',
      /successful requests.*start-to-completion/
    );
    assert.equal(
      firstRow.querySelector('[data-column="rate"]')?.textContent,
      '64'
    );
    assert.equal(
      firstRow.querySelector('[data-column="achievedRate"]')?.textContent,
      '47.26'
    );
    assert.equal(
      firstRow.querySelector('[data-column="conc"]')?.textContent,
      '13.38'
    );
    assert.equal(
      secondRow.querySelector('[data-column="achievedRate"]')?.textContent,
      '-'
    );
    assert.equal(
      secondRow.querySelector('[data-column="conc"]')?.textContent,
      '-'
    );
    assert.match(
      doc.querySelector('th[data-column="tps"]')?.textContent || '',
      /Total Throughput/
    );
    assert.match(
      doc.querySelector('th[data-column="out"]')?.textContent || '',
      /Output Throughput/
    );
    assert.equal(
      firstRow.querySelector('[data-column="out"]')?.textContent,
      '1,500'
    );
    dom.window.close();
  });
}

for (const slo of [false, true]) {
  test(`${slo ? 'SLO' : 'throughput'} markers describe independent facts without duplicated peak badges`, () => {
    detail = {
      load_type: 'concurrency',
      auto_tune: true,
      ...(slo ? { slo_avg_ttft_ms: 500 } : {})
    };
    const rows = [
      {
        id: 1,
        rate: 64,
        sequence: 0,
        request_total: 100,
        request_successful: 100,
        tokens_per_second_mean: 10000,
        output_tokens_per_second_mean: 1500,
        time_to_first_token_mean: 100
      },
      {
        id: 2,
        rate: 128,
        sequence: 1,
        request_total: 100,
        request_successful: 100,
        tokens_per_second_mean: 9000,
        output_tokens_per_second_mean: 1400,
        time_to_first_token_mean: 600
      }
    ] as any;
    const points = buildStagePoints(rows, {
      recommendedRate: 64,
      peakRate: 64,
      sloTargets: detail
    });
    const html = renderToStaticMarkup(
      createElement(Overview, { points, probes: [], onSelect: () => {} })
    );
    const dom = new JSDOM(html);
    const cell = dom.window.document.querySelector(
      'tbody tr [data-column="rate"]'
    )!;
    assert.equal(cell.textContent?.match(/Peak Throughput/g)?.length, 1);
    assert.equal(cell.textContent?.includes('SLO Capacity'), slo);
    assert.match(cell.textContent || '', /▲Peak Throughput/);
    assert.equal(cell.textContent?.includes('⭐'), slo);
    const hints = [...cell.querySelectorAll('[data-tooltip]')]
      .map((n) => n.getAttribute('data-tooltip'))
      .join(' ');
    assert.match(hints, /Highest recorded total TPS among measured points/);
    if (slo)
      assert.match(
        hints,
        /Highest measured load meeting all configured SLO targets/
      );
    dom.window.close();
  });
}
