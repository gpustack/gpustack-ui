import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/en-US/benchmark';
import chineseMessages from '../../../../../locales/zh-CN/benchmark';

let translations = (messages as any).default ?? messages;
const element = ({ children, className }: any) =>
  createElement('div', { className }, children);
const table = ({ columns, dataSource, rowKey = 'key', loading }: any) =>
  createElement(
    'div',
    null,
    loading !== false
      ? createElement('span', { role: 'progressbar' }, 'Loading')
      : null,
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
            createElement(
              'th',
              { key: c.dataIndex, 'data-column': c.dataIndex },
              c.title
            )
          )
        )
      ),
      createElement(
        'tbody',
        null,
        dataSource.map((r: any) =>
          createElement(
            'tr',
            { key: r[rowKey], 'data-row-key': r[rowKey] },
            columns.map((c: any) =>
              createElement(
                'td',
                { key: c.dataIndex, 'data-column': c.dataIndex },
                c.render ? c.render(r[c.dataIndex], r) : r[c.dataIndex]
              )
            )
          )
        )
      )
    )
  );
const button = ({
  children,
  onClick,
  'aria-expanded': expanded,
  'aria-controls': controls,
  'aria-label': label
}: any) =>
  createElement(
    'button',
    {
      onClick,
      'aria-expanded': expanded,
      'aria-controls': controls,
      'aria-label': label
    },
    children
  );
mock.module('@gpustack/core-ui', {
  namedExports: {
    Table: table,
    IconFont: () => null,
    SectionTitle: element,
    HeadlessCollapse: ({ open, children }: any) =>
      open ? element({ children }) : null
  }
});
mock.module('@ant-design/icons', {
  namedExports: {
    RightOutlined: () => null,
    DownOutlined: () => null,
    QuestionCircleOutlined: () => null
  }
});
mock.module('antd', {
  namedExports: {
    Row: element,
    Col: element,
    Flex: element,
    Space: element,
    Button: button,
    Tooltip: ({ children, title }: any) =>
      createElement('span', { 'data-tooltip': title }, children)
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
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => translations[id] || id })
  }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    loadAxisLabelId: (d: any) =>
      d.load_type === 'concurrency'
        ? 'benchmark.form.concurrency'
        : 'benchmark.table.requestRate',
    loadValueDecimals: (d: any) => (d.load_type === 'concurrency' ? 0 : 1)
  }
});
let detail: any = {};
mock.module(
  new URL('../../../config/detail-context.ts', import.meta.url).href,
  { namedExports: { useDetailContext: () => ({ detailData: detail }) } }
);
const { default: MetricsResult } = await import('../metrics-result');

const allHeaders = [
  'Metric',
  'Avg',
  'Min',
  'Max',
  'P25',
  'P50',
  'P75',
  'P90',
  'P95',
  'P99'
];
const distribution = (
  mean: number,
  p50: number,
  p95: number,
  p99: number,
  max = p99 * 2,
  min = 1
) => ({
  successful: {
    mean,
    min,
    max,
    percentiles: {
      p25: p50 / 2,
      p50,
      p75: (p50 + p95) / 2,
      p90: p95 - 1,
      p95,
      p99
    }
  }
});
const recorded = () => ({
  rate: 45,
  request_total: 1350,
  request_successful: 1350,
  request_errored: 0,
  request_incomplete: 0,
  requests_per_second_mean: 20.09,
  request_concurrency_mean: 443.9,
  request_concurrency_max: 512,
  tokens_per_second_mean: 23319,
  input_tokens_per_second_mean: 21365.59,
  output_tokens_per_second_mean: 2573.13,
  time_to_first_token_mean: 17183.83,
  time_to_first_token_p95: 32000.456,
  time_to_first_token_p99: 35225.45,
  inter_token_latency_mean: 38.63,
  inter_token_latency_p95: 43.456,
  inter_token_latency_p99: 46.56,
  itl_per_chunk_mean: 38.96,
  itl_per_chunk_p95: 55.55,
  itl_per_chunk_p99: 60.38,
  itl_per_chunk_max: 1769.58,
  request_latency_mean: 22.09,
  request_latency_p95: 33.45,
  request_latency_p99: 40.67,
  raw_metrics: {
    benchmarks: [
      {
        duration: 67.18,
        metrics: {
          request_totals: {
            total: 1350,
            successful: 1350,
            errored: 0,
            incomplete: 0
          },
          requests_per_second: distribution(19.9, 19, 22, 24, 13797.05, 0),
          request_concurrency: distribution(400, 430, 480, 500, 9999, 1),
          tokens_per_second: distribution(
            23000,
            1900,
            7000,
            25000,
            19784091.47,
            65.82
          ),
          prompt_tokens_per_second: distribution(
            21000,
            21000,
            39000,
            50000,
            198033.71,
            1036.68
          ),
          output_tokens_per_second: distribution(
            2500,
            1800,
            6600,
            12000,
            50328.48,
            65.82
          ),
          time_to_first_token_ms: distribution(
            17000,
            12000.125,
            30000,
            35000,
            40000,
            26.477
          ),
          inter_token_latency_ms: distribution(38, 37.123, 43, 46, 53, 15.337),
          time_per_output_token_ms: distribution(200, 200, 200, 200),
          inter_token_latency_per_chunk_ms: distribution(
            39,
            25.123,
            55,
            60,
            2000,
            0.014
          ),
          request_latency: distribution(22, 18.12, 33, 40, 50, 3.29),
          prompt_token_count: {
            successful: {
              mean: 1032,
              min: 1000,
              max: 1200,
              percentiles: {
                p25: 1024,
                p50: 1030,
                p75: 1055,
                p90: 1079,
                p95: 1080,
                p99: 1100
              }
            }
          },
          output_token_count: distribution(128, 128, 160, 200, 256, 64)
        }
      }
    ]
  }
});
const values = (doc: Document, kind: string, key: string) =>
  [...doc.querySelectorAll(`.${kind}-table tr[data-row-key="${key}"] td`)]
    .slice(1)
    .map((n) => n.textContent);
const headers = (doc: Document, kind: string) =>
  [...doc.querySelectorAll(`.${kind}-table th`)].map((n) => n.textContent);
const render = (data?: any) =>
  new JSDOM(
    renderToStaticMarkup(
      createElement(MetricsResult, data === undefined ? {} : { data })
    )
  );

for (const profile of ['Max Throughput', 'Meet Latency SLO']) {
  test(`${profile}: compact metadata and complete load/latency tables use only the selected point`, () => {
    const data = recorded();
    detail = {
      ...data,
      profile,
      load_type: profile === 'Max Throughput' ? 'fixed_rate' : 'concurrency'
    };
    const dom =
      profile === 'Max Throughput'
        ? ((detail.requests_per_second_mean = 900), render(data))
        : render();
    const doc = dom.window.document;
    assert.equal(doc.querySelector('[role="progressbar"]'), null);
    assert.equal(doc.querySelectorAll('.stage-meta .meta-item').length, 3);
    assert.doesNotMatch(
      doc.querySelector('.stage-meta')?.textContent || '',
      /Achieved|443\.9|512/
    );
    assert.deepEqual(headers(doc, 'load'), ['Metric', 'Avg', 'Min', 'Max']);
    assert.deepEqual(values(doc, 'load', 'requests'), [
      '20.09',
      '0',
      '13,797.05'
    ]);
    assert.deepEqual(values(doc, 'load', 'concurrency'), [
      '443.90',
      '1',
      '512'
    ]);
    assert.deepEqual(values(doc, 'load', 'total'), [
      '23,319',
      '65.82',
      '19,784,091.47'
    ]);
    assert.deepEqual(headers(doc, 'latency'), allHeaders);
    assert.deepEqual(values(doc, 'latency', 'ttft'), [
      '17,183.83',
      '26.48',
      '40,000',
      '6,000.06',
      '12,000.13',
      '21,000.06',
      '29,999',
      '32,000.46',
      '35,225.45'
    ]);
    assert.deepEqual(values(doc, 'latency', 'tpot'), [
      '38.63',
      '15.34',
      '53',
      '18.56',
      '37.12',
      '40.06',
      '42',
      '43.46',
      '46.56'
    ]);
    assert.equal(values(doc, 'latency', 'itl')[2], '1,769.58');
    assert.equal(values(doc, 'latency', 'latency')[0], '22.09');
    assert.match(
      doc.querySelector('.latency-table tr[data-row-key="latency"] td')
        ?.textContent || '',
      /\(s\)/
    );
    assert.match(
      doc.querySelector('.load-table tr[data-row-key="requests"] td')
        ?.textContent || '',
      /req\/s/
    );
    assert.match(
      doc
        .querySelector('.load-table th[data-column="max"] [data-tooltip]')
        ?.getAttribute('data-tooltip') || '',
      /sustained/i
    );
    assert.doesNotMatch(
      doc.body.textContent || '',
      /Show percentiles|Show more statistics|ITL Max/
    );
    assert.equal(doc.querySelectorAll('.latency-table').length, 1);
    dom.window.close();
  });
}

test('statistics headers follow the active locale and retain percentile notation', () => {
  const previous = translations;
  translations = (chineseMessages as any).default ?? chineseMessages;
  try {
    detail = { load_type: 'fixed_rate' };
    const dom = render(recorded());
    assert.deepEqual(headers(dom.window.document, 'load'), [
      '指标',
      '均值',
      '最小',
      '最大'
    ]);
    assert.deepEqual(headers(dom.window.document, 'latency'), [
      '指标',
      '均值',
      '最小',
      '最大',
      'P25',
      'P50',
      'P75',
      'P90',
      'P95',
      'P99'
    ]);
    dom.window.close();
  } finally {
    translations = previous;
  }
});

test('an unknown incomplete count stays unknown instead of fabricating a request total', () => {
  detail = { load_type: 'fixed_rate' };
  const partial = render({ request_successful: 100, request_errored: 4 });
  assert.match(
    partial.window.document.querySelector('.stage-meta')?.textContent || '',
    /100 \/ -/
  );
  partial.window.close();
  for (const fields of [{ request_total: 105 }, { request_incomplete: 0 }]) {
    const doc = render({
      request_successful: 100,
      request_errored: 4,
      ...fields
    });
    assert.match(
      doc.window.document.querySelector('.stage-meta')?.textContent || '',
      'request_total' in fields ? /100 \/ 105/ : /100 \/ 104/
    );
    doc.window.close();
  }
});

test('legacy report targets use their recorded configuration while stage probes never inherit it', () => {
  for (const loadType of ['fixed_rate', 'concurrency']) {
    detail = { load_type: loadType, request_rate: 45 };
    const report = render();
    const target = report.window.document.querySelector('.stage-meta');
    assert.match(
      target?.textContent || '',
      loadType === 'concurrency'
        ? /Target concurrency.*45/
        : /Target request rate.*45/
    );
    report.window.close();

    const probe = render({ rate: null, request_rate: 777 });
    assert.doesNotMatch(
      probe.window.document.querySelector('.stage-meta')?.textContent || '',
      /Target|45|777/
    );
    probe.window.close();
  }
});

test('raw-only statistics and unsupported metadata do not leak from another benchmark', () => {
  detail = { load_type: 'fixed_rate' };
  const dom = render({
    raw_metrics: {
      benchmarks: [
        {
          metrics: {
            requests_per_second: distribution(20.09, 1, 2, 3),
            request_concurrency: distribution(136.234, 1, 2, 3, 160),
            time_to_first_token_ms: distribution(100, 80, 150, 200)
          }
        },
        {
          metrics: {
            inter_token_latency_per_chunk_ms: distribution(999, 999, 999, 999)
          }
        }
      ]
    }
  });
  const doc = dom.window.document;
  assert.equal(values(doc, 'load', 'requests')[0], '20.09');
  assert.deepEqual(values(doc, 'load', 'concurrency'), ['136.23', '1', '160']);
  assert.equal(values(doc, 'latency', 'ttft')[0], '100');
  assert.deepEqual(values(doc, 'latency', 'itl'), Array(9).fill('-'));
  dom.window.close();
});

test('unknown statistics remain dashes while recorded zero rates/throughput and empty distributions are distinct', () => {
  detail = { load_type: 'fixed_rate' };
  const empty = {
    successful: {
      count: 0,
      mean: 0,
      min: 0,
      max: 0,
      percentiles: { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 }
    }
  };
  const dom = render({
    rate: 45,
    request_total: 1000,
    requests_per_second_mean: 0,
    tokens_per_second_mean: 0,
    output_tokens_per_second_mean: 999,
    time_to_first_token_mean: 0,
    time_to_first_token_p95: 0,
    time_to_first_token_p99: 0,
    itl_per_chunk_mean: 0,
    itl_per_chunk_p95: 0,
    itl_per_chunk_p99: 0,
    itl_per_chunk_max: 0,
    raw_metrics: {
      benchmarks: [
        {
          metrics: {
            time_to_first_token_ms: empty,
            inter_token_latency_per_chunk_ms: empty
          }
        }
      ]
    }
  });
  const doc = dom.window.document;
  assert.deepEqual(values(doc, 'load', 'requests'), ['0.00', '-', '-']);
  assert.deepEqual(values(doc, 'load', 'concurrency'), ['-', '-', '-']);
  assert.equal(values(doc, 'load', 'total')[0], '0');
  assert.deepEqual(values(doc, 'latency', 'ttft'), Array(9).fill('-'));
  assert.deepEqual(values(doc, 'latency', 'itl'), Array(9).fill('-'));
  dom.window.close();
});

test('TPOT keeps its positive fallback across the complete statistic set and stays distinct from ITL', () => {
  detail = { load_type: 'fixed_rate' };
  const dom = render({
    inter_token_latency_mean: 0,
    inter_token_latency_p95: 0,
    inter_token_latency_p99: 0,
    time_per_output_token_mean: 12.34,
    time_per_output_token_p95: 16.78,
    time_per_output_token_p99: 18.9,
    itl_per_chunk_mean: 70,
    raw_metrics: {
      benchmarks: [
        {
          metrics: {
            inter_token_latency_ms: distribution(0, 0, 0, 0, 0, 0),
            time_per_output_token_ms: distribution(99, 10.12, 16, 18, 22, 5)
          }
        }
      ]
    }
  });
  const doc = dom.window.document;
  assert.deepEqual(values(doc, 'latency', 'tpot'), [
    '12.34',
    '5',
    '22',
    '5.06',
    '10.12',
    '13.06',
    '15',
    '16.78',
    '18.9'
  ]);
  assert.equal(values(doc, 'latency', 'itl')[0], '70');
  dom.window.close();
});

test('request-size disclosure adds only token data, with the same ordering and no duplicate latency table', async () => {
  const data = recorded();
  detail = {
    ...data,
    profile: 'Max Throughput',
    load_type: 'fixed_rate',
    dataset_input_tokens: 999999
  };
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost'
  });
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldAct = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true
  });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await act(async () => root.render(createElement(MetricsResult, { data })));
    const doc = dom.window.document;
    const toggle = doc.querySelector(
      'button[aria-controls]'
    ) as HTMLButtonElement;
    assert.ok(toggle);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(doc.querySelector('.tokens-table'), null);
    await act(async () =>
      toggle.dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true })
      )
    );
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.deepEqual(headers(doc, 'tokens'), allHeaders);
    assert.deepEqual(values(doc, 'tokens', 'input'), [
      '1,032',
      '1,000',
      '1,200',
      '1,024',
      '1,030',
      '1,055',
      '1,079',
      '1,080',
      '1,100'
    ]);
    assert.equal(doc.querySelectorAll('.latency-table').length, 1);
    assert.equal(doc.querySelectorAll('.load-table').length, 1);
    assert.match(
      doc.querySelector('.tokens-table tr[data-row-key="input"] td')
        ?.textContent || '',
      /tokens\/request/
    );
    await act(async () =>
      toggle.dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true })
      )
    );
    assert.equal(doc.querySelector('.tokens-table'), null);
  } finally {
    await act(async () => root.unmount());
    Object.assign(globalThis, {
      window: oldWindow,
      document: oldDocument,
      IS_REACT_ACT_ENVIRONMENT: oldAct
    });
    dom.window.close();
  }
});
