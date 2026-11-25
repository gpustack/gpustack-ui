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
const table = ({ columns, dataSource }: any) =>
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
  );
mock.module('@gpustack/core-ui', {
  namedExports: { SectionTitle: element, Table: table }
});
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
    ConfigProvider: element,
    Flex: element,
    Tooltip: (props: any) => {
      tooltipProps.push(props);
      return createElement(
        'span',
        { 'data-tooltip': props.title },
        props.children
      );
    },
    Table: table
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

test('sample-target completion displays evaluated success without an early-stop warning', () => {
  detail = { load_type: 'concurrency', slo_avg_ttft_ms: 500 };
  const points = buildStagePoints(
    [
      {
        id: 2,
        sequence: 0,
        rate: 8,
        request_total: 100,
        request_successful: 100,
        request_errored: 0,
        request_incomplete: 0,
        time_to_first_token_mean: 100,
        tokens_per_second_mean: 900
      },
      {
        id: 1,
        sequence: 0,
        rate: 16,
        request_total: 65,
        request_successful: 54,
        request_errored: 0,
        request_incomplete: 11,
        time_to_first_token_mean: 100,
        tokens_per_second_mean: 1000,
        raw_metrics: {
          termination: {
            reason: 'min_requests',
            requested: 50,
            processed: 50,
            cancelled_at_boundary: 11
          }
        }
      }
    ] as any,
    { recommendedRate: 16, peakRate: 16, sloTargets: detail }
  );
  tooltipProps = [];
  const dom = new JSDOM(
    renderToStaticMarkup(
      createElement(Overview, { points, probes: [], onSelect: () => {} })
    )
  );
  const success = dom.window.document.querySelector('[data-column="success"]');
  const cell = dom.window.document.querySelector(
    'tbody tr:last-child [data-column="success"]'
  );
  assert.equal(cell?.textContent, '54/54');
  assert.doesNotMatch(
    cell?.innerHTML || '',
    /color:\s*var\(--color-status-error-text\)/
  );
  assert.match(
    dom.window.document.querySelector('.pill')?.textContent || '',
    /100%.*154\s*\/\s*154/
  );
  assert.equal(
    tooltipProps.some((p) => String(p.title).startsWith('Stopped early')),
    false
  );
  const samplingTooltip = tooltipProps.find((p) =>
    renderToStaticMarkup(p.title).includes('11 requests were cancelled')
  );
  assert.ok(samplingTooltip);
  const tooltip = JSDOM.fragment(renderToStaticMarkup(samplingTooltip.title));
  const paragraphs = tooltip.firstElementChild?.children;
  assert.equal(paragraphs?.length, 2);
  assert.match(paragraphs?.[0].textContent || '', /Measured requests: 65/);
  assert.match(paragraphs?.[1].textContent || '', /54 samples/);
  assert.ok(success);
  dom.window.close();
});

test('a nested legacy termination shows the early-stop reason and counts', () => {
  detail = { load_type: 'concurrency' };
  const points = buildStagePoints(
    [
      { id: 1, sequence: 0, rate: 8 },
      {
        id: 2,
        sequence: 1,
        rate: 16,
        raw_metrics: {
          benchmarks: [
            {
              termination: {
                reason: 'max_duration',
                requested: 100,
                processed: 40
              }
            }
          ]
        }
      }
    ] as any,
    {}
  );
  tooltipProps = [];
  renderToStaticMarkup(
    createElement(Overview, { points, probes: [], onSelect: () => {} })
  );
  assert.ok(
    tooltipProps.some(
      ({ title }) =>
        title ===
        'Stopped early: hit the per-stage time limit — 40/100 requests ran.'
    )
  );
});

test('load sweep follows the first higher failing target after an intermediate passing load', () => {
  detail = {
    load_type: 'concurrency',
    slo_avg_ttft_ms: 500,
    slo_p99_tpot_ms: 50
  };
  const points = buildStagePoints(
    [
      {
        id: 1,
        rate: 16,
        sequence: 0,
        request_total: 100,
        request_successful: 100,
        time_to_first_token_mean: 100,
        inter_token_latency_p99: 20
      },
      {
        id: 2,
        rate: 32,
        sequence: 1,
        request_total: 100,
        request_successful: 100,
        time_to_first_token_mean: 200,
        inter_token_latency_p99: 40
      },
      {
        id: 3,
        rate: 64,
        sequence: 2,
        request_total: 100,
        request_successful: 100,
        time_to_first_token_mean: 300,
        inter_token_latency_p99: 60
      },
      {
        id: 4,
        rate: 128,
        sequence: 3,
        request_total: 100,
        request_successful: 100,
        time_to_first_token_mean: 700,
        inter_token_latency_p99: 80
      }
    ] as any,
    { recommendedRate: 16, sloTargets: detail }
  );
  const html = renderToStaticMarkup(
    createElement(Overview, { points, probes: [], onSelect: () => {} })
  );
  assert.equal(sweepProps.labels.ttftP99, 'TPOT P99');
  assert.equal(sweepProps.latencyThreshold, 50);
  assert.deepEqual(points.map(sweepProps.latencyValue), [20, 40, 60, 80]);
  assert.doesNotMatch(html, /Total throughput and TPOT P99/);
  renderToStaticMarkup(sweepProps.header);
  assert.match(
    renderToStaticMarkup(tooltipProps.at(-1).title),
    /Total throughput and TPOT P99/
  );
});

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
    assert.deepEqual(columnKeys.slice(0, 3), ['rate', 'conc', 'achievedRate']);
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

for (const rate of [0.5, 0.01, 0.001, 1.2345]) {
  test(`stage table retains configured ${rate} req/s`, () => {
    detail = { load_type: 'fixed_rate', auto_tune: false, profile: 'Custom' };
    const points = buildStagePoints(
      [
        { id: 1, sequence: 0, rate, request_total: 10, request_successful: 10 },
        {
          id: 2,
          sequence: 1,
          rate: 2,
          request_total: 10,
          request_successful: 10
        }
      ] as any,
      {}
    );
    const dom = new JSDOM(
      renderToStaticMarkup(
        createElement(Overview, { points, probes: [], onSelect: () => {} })
      )
    );
    assert.equal(
      dom.window.document.querySelector('tbody [data-column="rate"] .n')
        ?.textContent,
      String(rate)
    );
    dom.window.close();
  });
}

test('a passing post-peak stage displays throughput decline without an overload verdict', () => {
  detail = {
    load_type: 'concurrency',
    auto_tune: true,
    slo_avg_ttft_ms: 1000
  };
  const points = buildStagePoints(
    [
      {
        id: 1,
        rate: 128,
        sequence: 0,
        request_total: 100,
        request_successful: 100,
        tokens_per_second_mean: 36988.27,
        time_to_first_token_mean: 160.52
      },
      {
        id: 2,
        rate: 256,
        sequence: 1,
        request_total: 100,
        request_successful: 100,
        tokens_per_second_mean: 33067.6,
        time_to_first_token_mean: 305.98
      }
    ] as any,
    { recommendedRate: 256, peakRate: 128, sloTargets: detail }
  );
  const dom = new JSDOM(
    renderToStaticMarkup(
      createElement(Overview, { points, probes: [], onSelect: () => {} })
    )
  );
  const stage = dom.window.document.querySelectorAll('tbody tr')[1];
  assert.match(stage.textContent || '', /SLO Capacity.*Throughput decline/);
  assert.doesNotMatch(stage.textContent || '', /Overloaded/);
  assert.equal(stage.querySelector('[data-column="slo"]'), null);
  assert.equal(sweepProps.labels.declining, 'Throughput decline');
  dom.window.close();
});
