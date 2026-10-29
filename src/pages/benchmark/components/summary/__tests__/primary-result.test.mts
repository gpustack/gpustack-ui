import * as requireForTest from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, cloneElement, createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
const element = ({ children, className }: any) =>
  createElement('div', { className }, children);
mock.module('@gpustack/core-ui', { namedExports: { SectionTitle: element } });
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
    Flex: element,
    Tooltip: ({ title, children, trigger }: any) =>
      createElement(
        'div',
        {
          'data-trigger': JSON.stringify(trigger),
          'data-tooltip':
            title == null
              ? undefined
              : renderToStaticMarkup(createElement('span', null, title))
        },
        children
      ),
    Button: ({ children, type: _type, ...props }: any) =>
      createElement('button', { ...props, type: 'button' }, children),
    Divider: element
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any = {}) => {
        let parts: any[] = [translations[id] || id];
        for (const [key, value] of Object.entries(values)) {
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
        }
        return parts.every((p) => typeof p === 'string')
          ? parts.join('')
          : parts;
      }
    })
  }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    loadAxisLabelId: (d: any) =>
      d?.load_type === 'concurrency'
        ? 'benchmark.form.concurrency'
        : 'benchmark.form.rate',
    loadValueDecimals: (d: any) => (d?.load_type === 'concurrency' ? 0 : 2)
  }
});
let detail: any = {};
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  {
    namedExports: { useDetailContext: () => ({ detailData: detail, id: 460 }) }
  }
);
const {
  buildStagePoints,
  configuredSloMetrics,
  isSloCapacityPoint,
  logDomain
} = await import('../metrics');
const { default: PrimaryResult } = await import('../best-points');

const row = (rate: number, output: number, ttft = 100, ok = 100) =>
  ({
    id: rate,
    sequence: 0,
    rate,
    request_total: 100,
    request_successful: ok,
    request_errored: 100 - ok,
    tokens_per_second_mean: output * 2,
    output_tokens_per_second_mean: output,
    time_to_first_token_mean: ttft,
    time_to_first_token_p99: ttft * 2,
    inter_token_latency_mean: 6
  }) as any;
const render = (rows: any[]) =>
  renderToStaticMarkup(
    createElement(PrimaryResult, {
      points: buildStagePoints(rows, {
        recommendedRate: detail.recommended_rate,
        peakRate: detail.peak_rate,
        isConcurrency: detail.load_type === 'concurrency',
        primaryPoint: detail.validity?.primary_point,
        peakPoint: detail.validity?.peak_point,
        sloTargets: detail
      }),
      onSelect: () => {}
    })
  );

test('a server-selected failing point is inspectable but never labeled as SLO capacity or replaced', () => {
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: 32,
    peak_rate: 32,
    slo_avg_ttft_ms: 500
  };
  const rows = [row(16, 4000, 100), row(32, 5000, 900)];
  const points = buildStagePoints(rows, {
    recommendedRate: 32,
    peakRate: 32,
    sloTargets: detail
  });
  assert.equal(points[1].isBest, true);
  assert.equal(points[1].sloPass, false);
  assert.equal(isSloCapacityPoint(points[1]), false);
  assert.equal(render(rows), '');
});

test('raw p95 TTFT and end-to-end measurements support legacy SLO verdicts in milliseconds', () => {
  const data = {
    ...row(32, 4000),
    request_latency_mean: 2,
    raw_metrics: {
      metrics: {
        time_to_first_token_ms: {
          successful: { count: 100, percentiles: { p95: 450 } }
        },
        request_latency: {
          successful: { count: 100, percentiles: { p95: 2.5 } }
        }
      }
    }
  } as any;
  const targets = { slo_p95_ttft_ms: 500, slo_p95_latency_ms: 3000 };
  const point = buildStagePoints([data], {
    recommendedRate: 32,
    sloTargets: targets
  })[0];
  assert.equal(point.sloPass, true);
  assert.equal(isSloCapacityPoint(point), true);
  assert.deepEqual(
    configuredSloMetrics(
      point,
      targets,
      (id: string) => translations[id] || id
    ).map((metric) => metric.value),
    [450, 2500]
  );
});

test('configured SLO labels use the provided metric and aggregation translations', () => {
  const targets = { slo_avg_ttft_ms: 500 };
  const point = buildStagePoints([row(32, 4000)], { sloTargets: targets })[0];
  const labels: Record<string, string> = {
    'benchmark.form.slo.metric.ttft': '首字延迟',
    'benchmark.form.slo.agg.avg': '平均'
  };
  assert.equal(
    configuredSloMetrics(point, targets, (id: string) => labels[id] || id)[0]
      .label,
    '首字延迟 平均'
  );
});

test('empty raw latency samples do not make flat p95 defaults pass the SLO', () => {
  const data = {
    ...row(32, 4000),
    time_to_first_token_p95: 450,
    raw_metrics: {
      metrics: { time_to_first_token_ms: { successful: { count: 0 } } }
    }
  } as any;
  const point = buildStagePoints([data], {
    recommendedRate: 32,
    sloTargets: { slo_p95_ttft_ms: 500 }
  })[0];
  assert.equal(point.sloPass, false);
  assert.equal(isSloCapacityPoint(point), false);
});

test('log domains ignore missing and non-finite thresholds and samples', () => {
  assert.deepEqual(logDomain([10, 20, undefined, null, NaN, Infinity]), {
    min: 10,
    max: 100
  });
  assert.equal(logDomain([undefined, null, NaN, Infinity]), null);
});

for (const slo of [false, true]) {
  test(`${slo ? 'SLO' : 'Max'} headline selects the exact primary stage through an accessible control`, async () => {
    const { JSDOM } = await import('jsdom');
    const { createRoot } = await import('react-dom/client');
    const dom = new JSDOM('<div id="root"></div>');
    const previous = Object.fromEntries(
      ['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'].map(
        (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]
      )
    );
    Object.defineProperties(globalThis, {
      window: { value: dom.window, configurable: true },
      document: { value: dom.window.document, configurable: true },
      navigator: { value: dom.window.navigator, configurable: true },
      IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
    });
    const root = createRoot(dom.window.document.getElementById('root')!);
    try {
      detail = {
        auto_tune: true,
        load_type: 'concurrency',
        recommended_rate: slo ? 16 : 32,
        peak_rate: 32,
        ...(slo ? { slo_avg_ttft_ms: 500 } : {})
      };
      const points = buildStagePoints(
        [row(16, 4000, 100), row(32, 5000, 900)],
        {
          recommendedRate: detail.recommended_rate,
          peakRate: 32,
          sloTargets: detail
        }
      );
      const selected: any[] = [];
      await act(async () => {
        root.render(
          createElement(PrimaryResult, {
            points,
            onSelect: (point: any) => selected.push(point)
          })
        );
      });
      const button = dom.window.document.querySelector('button.hero');
      assert.ok(button);
      assert.match(
        button.getAttribute('aria-label') || '',
        /Select measured point/
      );
      assert.doesNotMatch(
        dom.window.document.body.textContent || '',
        /View primary result/
      );
      await act(async () => {
        button.dispatchEvent(
          new dom.window.MouseEvent('click', { bubbles: true })
        );
      });
      assert.equal(selected.length, 1);
      assert.equal(selected[0].load, detail.recommended_rate);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete (globalThis as any)[key];
      }
    }
  });
}

test('SLO keeps its load headline, original stage metrics plus Total, and original right-side facts', () => {
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: 143,
    peak_rate: 256,
    slo_avg_ttft_ms: 500,
    slo_avg_tpot_ms: 50,
    validity: {
      slo_boundary_located: true,
      slo_bracket: [143, 144],
      primary_point: { input_tokens: null, sequence: 0, rate: 143 },
      peak_point: { input_tokens: null, sequence: 0, rate: 256 }
    }
  };
  const html = render([
    { ...row(128, 14004.82, 415.75), tokens_per_second_mean: 29322.58 },
    {
      ...row(143, 13413.13, 499.09),
      tokens_per_second_mean: 28083.74,
      input_tokens_per_second_mean: 15131.58,
      request_concurrency_mean: 137.375,
      time_to_first_token_p99: 1120.18,
      itl_per_chunk_p99: 23.456,
      raw_metrics: {
        metrics: {
          inter_token_latency_ms: {
            successful: { percentiles: { p99: 11.265 } }
          }
        }
      }
    },
    {
      ...row(256, 14724.31, 1351.3),
      tokens_per_second_mean: 30829.02,
      time_to_first_token_p99: 1623.7
    }
  ]);
  assert.match(html, /Highest measured concurrency meeting SLO/);
  assert.match(html, /<span class="v">143<\/span>/);
  const dom = new requireForTest.JSDOM(html);
  const stats = Object.fromEntries(
    [...dom.window.document.querySelectorAll('.stat')].map((n) => [
      n.querySelector('.k > span')?.textContent,
      n.querySelector('.n')?.textContent
    ])
  );
  assert.deepEqual(Object.keys(stats), [
    'Achieved concurrency Avg',
    'Total',
    'Input',
    'Output',
    'TTFT p99',
    'TPOT p99',
    'ITL p99'
  ]);
  assert.deepEqual(stats, {
    'Achieved concurrency Avg': '137.38',
    Total: '28,084',
    Input: '15,132',
    Output: '13,413',
    'TTFT p99': '1,120',
    'TPOT p99': '11',
    'ITL p99': '23'
  });
  assert.match(
    dom.window.document.querySelector('.slo')?.textContent || '',
    /TTFT Avg ≤ 500 ms.*TPOT Avg ≤ 50 ms/
  );
  assert.doesNotMatch(
    dom.window.document.querySelector('.col-why')?.textContent || '',
    /SLO capacity/
  );
  assert.match(
    dom.window.document
      .querySelector('.col-hero [data-tooltip]')
      ?.getAttribute('data-tooltip') || '',
    /143 conc\..*144 conc\./
  );
  assert.match(
    dom.window.document.querySelector('.col-why')?.textContent || '',
    /100%.*100 of 100 requests succeeded/
  );
  assert.match(
    dom.window.document.querySelector('.col-why')?.textContent || '',
    /Peak at.*256.*\+10%.*\+45%.*TTFT p99/
  );
  assert.doesNotMatch(
    html,
    /Best Operating Point|View primary result|benchmark\.detail\.result\.selectPrimary/
  );
  dom.window.close();
});

test('throughput headline uses total rather than output throughput', () => {
  detail = {
    auto_tune: true,
    load_type: 'fixed_rate',
    recommended_rate: 54,
    peak_rate: 54
  };
  detail.validity = {
    primary_point: { input_tokens: null, sequence: 0, rate: 54 },
    peak_point: { input_tokens: null, sequence: 0, rate: 54 }
  };
  const html = render([
    {
      ...row(54, 6699.08),
      tokens_per_second_mean: 60919.77,
      input_tokens_per_second_mean: 53888.9,
      requests_per_second_mean: 47.258,
      request_concurrency_mean: 13.375,
      time_to_first_token_mean: 84.58,
      time_to_first_token_p99: 157.276,
      itl_per_chunk_p99: 18.333,
      raw_metrics: {
        metrics: {
          inter_token_latency_ms: {
            successful: { percentiles: { p99: 8.765 } }
          }
        }
      }
    }
  ]);
  assert.match(html, /Highest measured total throughput/);
  assert.match(html, /<span class="v">60,920<\/span>/);
  const { JSDOM } = requireForTest;
  const dom = new JSDOM(html);
  const stats = Object.fromEntries(
    [...dom.window.document.querySelectorAll('.stat')].map((n) => [
      n.querySelector('.k > span')?.textContent,
      n.querySelector('.n')?.textContent
    ])
  );
  assert.deepEqual(Object.keys(stats).slice(-2), ['TPOT p99', 'ITL p99']);
  assert.deepEqual(stats, {
    'Target request rate': '54',
    'Achieved request rate Avg': '47.26',
    'Achieved concurrency Avg': '13.38',
    Input: '53,889',
    Output: '6,699',
    'TTFT p99': '157',
    'TPOT p99': '8.77',
    'ITL p99': '18'
  });
  dom.window.close();
  assert.doesNotMatch(
    html,
    /View primary result|benchmark\.detail\.result\.selectPrimary/
  );
});

test('manual measurements do not claim a searched optimum', () => {
  detail = {
    auto_tune: false,
    load_type: 'concurrency',
    recommended_rate: 20,
    peak_rate: 20
  };
  detail.validity = {
    primary_point: { input_tokens: null, sequence: 0, rate: 20 },
    peak_point: { input_tokens: null, sequence: 0, rate: 20 }
  };
  assert.match(render([row(20, 376)]), /Measured result/);
});

test('an unmet SLO has no primary card fabricated from its throughput peak', () => {
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: null,
    peak_rate: 4,
    slo_avg_ttft_ms: 50
  };
  const html = render([row(4, 4000, 100), row(8, 5000, 200)]);
  assert.match(html, /No measured point met the SLO/);
  assert.doesNotMatch(html, /5,000|4,000/);
});

test('an unmatched non-null primary descriptor waits for its stage without reporting an unmet SLO', () => {
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: 32,
    slo_avg_ttft_ms: 500,
    validity: {
      primary_point: { input_tokens: null, sequence: 1, rate: 32 }
    }
  };

  const html = render([row(32, 4000, 100)]);

  assert.equal(html, '');
});

test('an explicit null primary descriptor still reports no passing SLO point', () => {
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: 32,
    slo_met_rate: 32,
    slo_avg_ttft_ms: 500,
    validity: { primary_point: null }
  };

  const html = render([row(32, 4000, 100)]);

  assert.match(html, /No measured point met the SLO/);
  assert.doesNotMatch(html, /Highest measured concurrency meeting SLO/);
});

test('primary and total TPS peak facts can coincide without masking request health', () => {
  const points = buildStagePoints([row(32, 9000, 100, 90)], {
    recommendedRate: 32,
    peakRate: 32
  });
  assert.equal(points[0].isBest, true);
  assert.equal(points[0].isPeak, true);
  assert.equal(points[0].isOverloaded, true);
});

test('exact point descriptors distinguish identical loads and null forbids a legacy fallback', () => {
  const rows = [
    { ...row(32, 2000), input_tokens: 128, sequence: 0 },
    { ...row(32, 3000), input_tokens: 4096, sequence: 1 }
  ];
  const points = buildStagePoints(rows, {
    recommendedRate: 32,
    peakRate: 32,
    primaryPoint: { input_tokens: 128, sequence: 0, rate: 32 },
    peakPoint: { input_tokens: 4096, sequence: 1, rate: 32 }
  });
  assert.deepEqual(
    points.map((p) => [p.isBest, p.isPeak]),
    [
      [true, false],
      [false, true]
    ]
  );
  assert.equal(
    buildStagePoints(rows, { recommendedRate: 32, primaryPoint: null }).some(
      (p) => p.isBest
    ),
    false
  );
  assert.equal(
    buildStagePoints(rows.slice(0, 1), {
      recommendedRate: 32,
      primaryPoint: { input_tokens: 4096, sequence: 1, rate: 32 }
    }).some((p) => p.isBest),
    false
  );
});

mock.module(new URL('../../echarts.ts', import.meta.url).href, {
  defaultExport: {}
});
const { buildStageChartOption } = await import('../stage-chart');
mock.module(new URL('../stage-chart.tsx', import.meta.url).href, {
  namedExports: { C: {}, tooltipRows: (_rows: any, header: string) => header }
});
const { buildLoadSweepOption } = await import('../load-sweep');
for (const threshold of [1, 500]) {
  test(`main chart latency domain includes a configured ${threshold} ms threshold outside measured values`, () => {
    const points = buildStagePoints([row(16, 1000, 10), row(32, 2000, 20)], {
      recommendedRate: 32,
      peakRate: 32
    });
    const option: any = buildLoadSweepOption(
      {
        points,
        latencyValue: (p) => p.ttft,
        latencyThreshold: threshold,
        loadAxisName: 'Concurrency',
        loadAxisTitle: 'Concurrency',
        loadDecimals: 0,
        labels: {
          concurrency: 'Concurrency',
          primary: 'SLO Capacity',
          peak: 'Peak Throughput',
          throughput: 'Total',
          throughputAxis: 'Total (tok/s)',
          ttftP99: 'TTFT Avg',
          overloaded: 'Overloaded',
          sloBreached: 'SLO breached'
        }
      },
      '#ddd'
    );

    assert.ok(option.yAxis[1].min <= Math.min(10, threshold));
    assert.ok(option.yAxis[1].max >= Math.max(20, threshold));
    assert.equal(option.series[1].markLine.data[0].yAxis, threshold);
    assert.deepEqual(option.series[1].data, [10, 20]);
  });
}

test('main chart uses total throughput and the configured latency metric, preserving both point labels', () => {
  const points = buildStagePoints([row(54, 6699)], {
    recommendedRate: 54,
    peakRate: 54,
    sloTargets: { slo_avg_ttft_ms: 500 }
  });
  const option: any = buildLoadSweepOption(
    {
      points,
      latencyValue: (p) => p.ttft,
      latencyThreshold: 500,
      loadAxisName: 'Rate',
      loadAxisTitle: 'Rate (req/s)',
      loadDecimals: 0,
      labels: {
        concurrency: 'Concurrency',
        primary: 'SLO Capacity',
        peak: 'Peak Throughput',
        throughput: 'Total',
        throughputAxis: 'Total (tok/s)',
        ttftP99: 'TTFT Avg',
        overloaded: 'Overloaded',
        sloBreached: 'SLO breached'
      }
    },
    '#ddd'
  );
  assert.equal(option.series[0].data[0].value, 13398);
  assert.match(
    option.series[0].data[0].label.formatter,
    /SLO Capacity.*Peak Throughput/
  );
  assert.deepEqual(option.series[1].data, [100]);
  assert.equal(option.series[1].name, 'TTFT Avg');
  assert.equal(option.series[1].markLine.data[0].yAxis, 500);
});

let measuredRows: any[] = [];
mock.module(new URL('../../../apis/index.ts', import.meta.url).href, {
  namedExports: { queryBenchmarkResults: async () => measuredRows }
});
for (const component of [
  'config-summary',
  'running-hint',
  'validity-alert',
  'overview',
  'metrics-result'
]) {
  mock.module(new URL(`../${component}.tsx`, import.meta.url).href, {
    defaultExport: () => null
  });
}
mock.module(new URL('../selected-stage.tsx', import.meta.url).href, {
  defaultExport: ({ point }: any) =>
    createElement('pre', { id: 'stage-evidence' }, JSON.stringify(point?.raw))
});
const { default: Summary } = await import('../index');
test('a sole SLO-failing stage remains inspectable without becoming a primary result', async () => {
  const { JSDOM } = await import('jsdom');
  const { act } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const dom = new JSDOM('<div id="root"></div>');
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true },
    document: { value: dom.window.document, configurable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
  });
  measuredRows = [row(4, 4000, 100)];
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: null,
    peak_rate: 4,
    slo_avg_ttft_ms: 50
  };
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(Summary));
  });
  assert.match(container.textContent || '', /No measured point met the SLO/);
  assert.match(
    document.getElementById('stage-evidence')?.textContent || '',
    /"time_to_first_token_mean":100/
  );
  await act(async () => root.unmount());
  dom.window.close();
});

test('missing point descriptors use stored loads without internal compatibility messaging', () => {
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: 128,
    slo_met_rate: 128,
    peak_rate: 128,
    slo_avg_ttft_ms: 5000
  };
  const html = render([row(128, 1000), row(256, 750, 6000)]);
  assert.match(html, /Highest measured concurrency meeting SLO/);
  assert.match(html, /2,000/);
  assert.doesNotMatch(
    html,
    /Recorded result|Recorded peak|earlier analysis|objective-specific conclusions|legacyNote/
  );
});

for (const loadType of ['concurrency', 'fixed_rate']) {
  test(`legacy SLO ${loadType} uses the highest passing load instead of the peak-capped recommendation`, () => {
    detail = {
      auto_tune: true,
      load_type: loadType,
      recommended_rate: 128,
      slo_met_rate: 512,
      peak_rate: 128,
      slo_avg_ttft_ms: 500
    };
    const rows = [row(128, 10000, 100), row(512, 9000, 400)];
    const points = buildStagePoints(rows, {
      recommendedRate: detail.recommended_rate,
      peakRate: detail.peak_rate,
      sloTargets: detail
    });
    assert.equal(points.find((p) => p.isBest)?.load, 512);
    assert.equal(points.find((p) => p.isPeak)?.load, 128);

    const html = render(rows);
    const dom = new requireForTest.JSDOM(html);
    assert.equal(
      dom.window.document.querySelector('.hero .v')?.textContent,
      '512'
    );
    assert.match(
      dom.window.document.querySelector('.col-stats')?.textContent || '',
      /18,000/
    );
    dom.window.close();

    const option: any = buildLoadSweepOption(
      {
        points,
        latencyValue: (p) => p.ttft,
        latencyThreshold: 500,
        loadAxisName: 'Load',
        loadAxisTitle: 'Load',
        loadDecimals: 0,
        labels: {
          concurrency: 'Concurrency',
          primary: 'SLO Capacity',
          peak: 'Peak Throughput',
          throughput: 'Total',
          throughputAxis: 'Total (tok/s)',
          ttftP99: 'TTFT Avg',
          overloaded: 'Overloaded',
          sloBreached: 'SLO breached'
        }
      },
      '#ddd'
    );
    assert.match(option.series[0].data[1].label.formatter, /SLO Capacity/);
    assert.doesNotMatch(
      option.series[0].data[0].label.formatter || '',
      /SLO Capacity/
    );
  });
}

test('a legacy SLO load awaiting its stage does not report that no point passed', () => {
  detail = {
    recommended_rate: null,
    slo_met_rate: 512,
    slo_avg_ttft_ms: 500,
    load_type: 'concurrency'
  };
  assert.equal(render([row(128, 10000, 100)]), '');
});

test('an exact primary descriptor overrides a different stored SLO capacity', () => {
  detail = {
    recommended_rate: 128,
    slo_met_rate: 512,
    slo_avg_ttft_ms: 500,
    load_type: 'concurrency',
    validity: {
      primary_point: { rate: 256, sequence: 0, input_tokens: null }
    }
  };
  const dom = new requireForTest.JSDOM(
    render([row(128, 10000), row(256, 9500), row(512, 9000)])
  );
  assert.equal(
    dom.window.document.querySelector('.hero .v')?.textContent,
    '256'
  );
  dom.window.close();
});

test('an explicit legacy no-capacity result cannot fall back to its recommendation', () => {
  detail = {
    recommended_rate: 128,
    slo_met_rate: null,
    slo_avg_ttft_ms: 500,
    load_type: 'concurrency'
  };
  assert.match(render([row(128, 10000, 100)]), /No measured point met the SLO/);
});

test('the default stage selection follows the legacy SLO capacity', async () => {
  const { createRoot } = await import('react-dom/client');
  const dom = new requireForTest.JSDOM('<div id="root"></div>');
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true },
    document: { value: dom.window.document, configurable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
  });
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: 128,
    slo_met_rate: 512,
    peak_rate: 128,
    slo_avg_ttft_ms: 500
  };
  measuredRows = [row(128, 10000, 100), row(512, 9000, 400)];
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(Summary)));
    const selected = JSON.parse(
      document.getElementById('stage-evidence')!.textContent!
    );
    assert.equal(selected.rate, 512);
    assert.equal(selected.tokens_per_second_mean, 18000);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test('duplicate categorical load labels keep the primary guide at the exact point index', () => {
  const points = buildStagePoints(
    [
      { ...row(32, 1000), input_tokens: 128, sequence: 0 },
      { ...row(32, 2000), input_tokens: 4096, sequence: 1 }
    ],
    {
      recommendedRate: 32,
      primaryPoint: { input_tokens: 4096, sequence: 1, rate: 32 },
      sloTargets: { slo_avg_ttft_ms: 500 }
    }
  );
  const option: any = buildStageChartOption(
    {
      points,
      loadAxisName: 'Concurrency',
      loadAxisTitle: 'Concurrency',
      loadDecimals: 0,
      markerLabels: { primary: 'Primary', peak: 'Peak' },
      spec: {
        key: 'output',
        title: 'Output',
        note: '',
        yName: 'Output',
        fmt: String,
        marks: true,
        series: [{ name: 'Output', value: (p) => p.outTps, color: '#000' }]
      }
    },
    '#ddd'
  );
  assert.equal(option.series[0].markLine.data[0].xAxis, 1);
});

test('post-peak health uses total throughput even when output throughput rises', () => {
  const points = buildStagePoints(
    [
      { ...row(8, 100), tokens_per_second_mean: 1000 },
      { ...row(16, 200), tokens_per_second_mean: 960 },
      { ...row(32, 300), tokens_per_second_mean: 900 }
    ],
    { recommendedRate: 32, peakRate: 8 }
  );
  assert.equal(points[2].isOverloaded, true);
});

test('non-SLO primary and coincident peak render one green Peak Throughput marker', () => {
  const points = buildStagePoints([row(54, 6699)], {
    recommendedRate: 54,
    peakRate: 54
  });
  const chart: any = buildLoadSweepOption(
    {
      points,
      latencyValue: (p) => p.ttftP99,
      loadAxisName: 'Rate',
      loadAxisTitle: 'Rate',
      loadDecimals: 0,
      labels: {
        concurrency: 'Concurrency',
        primary: 'SLO Capacity',
        peak: 'Peak Throughput',
        throughput: 'Total',
        throughputAxis: 'TPS',
        ttftP99: 'TTFT P99',
        overloaded: 'Overloaded',
        sloBreached: 'SLO breached'
      }
    },
    '#ddd'
  );
  assert.equal(chart.series[0].data[0].label.formatter, 'Peak Throughput');
  assert.equal(chart.series[0].data[0].symbol, 'triangle');
  assert.doesNotMatch(
    chart.tooltip.formatter([{ dataIndex: 0 }]),
    /SLO Capacity/
  );
  const detailChart: any = buildStageChartOption(
    {
      points,
      loadAxisName: 'Rate',
      loadAxisTitle: 'Rate',
      loadDecimals: 0,
      markerLabels: { primary: 'SLO Capacity', peak: 'Peak Throughput' },
      spec: {
        key: 'throughput',
        title: 'TPS',
        note: '',
        yName: 'TPS',
        fmt: String,
        marks: true,
        series: [{ name: 'TPS', value: (p) => p.tps, color: '#000' }]
      }
    },
    '#ddd'
  );
  assert.equal(detailChart.series[0].markLine, undefined);
  assert.equal(
    detailChart.series[0].data[0].label.formatter,
    'Peak Throughput'
  );
  assert.equal(detailChart.series[0].data[0].itemStyle.color, '#16a34a');
  assert.equal(detailChart.series[0].data[0].symbol, 'triangle');
});

test('throughput card keeps missing measured request rate distinct from configured rate', () => {
  detail = {
    auto_tune: true,
    load_type: 'fixed_rate',
    recommended_rate: 54,
    peak_rate: 54
  };
  const html = render([
    {
      ...row(54, 6699),
      requests_per_second_mean: null,
      request_total: 1000,
      raw_metrics: { duration: 10 }
    }
  ]);
  const dom = new requireForTest.JSDOM(html);
  const measured = [...dom.window.document.querySelectorAll('.stat')].find(
    (n) =>
      n.querySelector('.k > span')?.textContent === 'Achieved request rate Avg'
  );
  assert.equal(measured?.querySelector('.n')?.textContent, '-');
  dom.window.close();
});
test('throughput card labels a concurrency-axis configured load separately from measured request rate', () => {
  detail = {
    auto_tune: true,
    load_type: 'concurrency',
    recommended_rate: 54,
    peak_rate: 54
  };
  const html = render([{ ...row(54, 6699), requests_per_second_mean: 18.75 }]);
  assert.match(html, /Target concurrency/);
  assert.doesNotMatch(html, /Target request rate/);
  const dom = new requireForTest.JSDOM(html);
  const stats = Object.fromEntries(
    [...dom.window.document.querySelectorAll('.stat')].map((n) => [
      n.querySelector('.k > span')?.textContent,
      n.querySelector('.n')?.textContent
    ])
  );
  assert.equal(stats['Target concurrency'], '54');
  assert.equal(stats['Achieved request rate Avg'], '18.75');
  assert.equal(stats['ITL p99'], '-');
  dom.window.close();
});
