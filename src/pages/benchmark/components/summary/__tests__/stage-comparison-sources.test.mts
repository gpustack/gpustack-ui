import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
let table: any;
const selectors: any[] = [];
const element = ({ children }: any) => createElement('div', null, children);
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => translations[id] || id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: { Table: (props: any) => ((table = props), null) }
});
mock.module('antd', {
  namedExports: {
    Flex: element,
    Typography: { Text: element },
    Button: element,
    Select: (props: any) => {
      selectors.push(props);
      return null;
    }
  }
});
mock.module(new URL('../stage-observations.tsx', import.meta.url).href, {
  namedExports: { MonitoringNotice: () => null }
});
const { default: StageComparison } = await import('../stage-comparison');

const points = [32, 24].map((load, sequence) => ({
  id: sequence + 1,
  load,
  raw: { id: sequence + 1, sequence, input_tokens: 4096, rate: load }
})) as any;
const stages = points.map((point: any, index: number) => ({
  id: `4096:${index}`,
  sequence: index,
  input_tokens: 4096,
  start: 100 + index * 100,
  end: 200 + index * 100
}));
const metric = (entries: [any, number, number][]) => ({
  metrics: {},
  sample_statistics: {
    waiting_requests: entries.map(([dimensions, peak, peak_at]) => ({
      dimensions,
      peak,
      peak_at,
      observed_samples: 1,
      expected_samples: 1
    }))
  }
});
const context = {
  stages,
  capabilities: {},
  instances: [
    { id: 81, name: 'prefill-instance', role: 'prefill' },
    { id: 82, name: 'decode-instance', role: 'decode' }
  ],
  workers: [{ id: 1, name: 'worker-one' }],
  devices: []
};
const data = (runtime: any, snapshot = context, resources: any = null) =>
  ({ context: snapshot, runtime, resources, errors: {} }) as any;
const compare = (current: any, baseline: any) => {
  renderToStaticMarkup(
    createElement(StageComparison, {
      point: points[1],
      points,
      baselineId: points[0].id,
      basis: 'custom',
      onBaseline() {},
      onShowBands() {},
      data: current,
      dataForPoint: () => baseline,
      onEvidence() {}
    })
  );
};
const row = (key: string) =>
  table.dataSource.find((item: any) => item.key === key);
const cell = (key: string, column: string) => {
  const content = table.columns
    .find((item: any) => item.key === column)
    .render(null, row(key));
  return typeof content === 'string' ? content : renderToStaticMarkup(content);
};

test('custom comparison exposes a meaningful empty prompt and selectable same-workload stages', () => {
  selectors.length = 0;
  let selected: number | null = null;
  renderToStaticMarkup(
    createElement(StageComparison, {
      point: points[1],
      points: [
        ...points,
        { ...points[0], id: 9, raw: { ...points[0].raw, input_tokens: 2048 } }
      ],
      baselineId: null,
      basis: 'custom',
      onBaseline: (id) => {
        selected = id;
      },
      onShowBands() {},
      data: data(metric([])),
      dataForPoint: () => data(metric([])),
      onEvidence() {}
    })
  );
  const select = selectors.find(
    (item) => item['aria-label'] === translations['benchmark.monitoring.custom']
  );
  assert.ok(select.placeholder, 'the empty control explains what to select');
  assert.equal(select.value, undefined);
  assert.deepEqual(
    select.options.map((option: any) => option.value),
    [points[0].id]
  );
  assert.match(select.options[0].label, /#1.*32/);
  select.onChange(points[0].id);
  assert.equal(selected, points[0].id);
});

test('stage comparison includes measured client load, recorded token rates and P95/P99 latency without integer rounding or token-rate reconstruction', () => {
  const current = {
    ...points[1],
    tps: 2384.17,
    raw: {
      ...points[1].raw,
      request_concurrency_mean: 3.96,
      requests_per_second_mean: 8.96,
      input_tokens_per_second_mean: 1263.1,
      output_tokens_per_second_mean: 1156.2,
      time_to_first_token_p95: 125.5,
      inter_token_latency_p95: 2.53,
      itl_per_chunk_p95: 5.51,
      request_latency_p95: 1.25,
      request_latency_p99: 1.75
    }
  };
  renderToStaticMarkup(
    createElement(StageComparison, {
      point: current,
      points: [points[0], current],
      baselineId: points[0].id,
      basis: 'custom',
      onBaseline() {},
      onShowBands() {},
      data: data(metric([])),
      dataForPoint: () => data(metric([])),
      onEvidence() {}
    })
  );
  assert.equal(row('concurrency').current, 3.96);
  assert.equal(cell('concurrency', 'current'), '3.96');
  assert.equal(row('request-rate').current, 8.96);
  assert.equal(row('input-tps').current, 1263.1);
  assert.equal(row('output-tps').current, 1156.2);
  assert.equal(
    row('tps').current,
    2384.17,
    'use recorded total, not input+output or P+D monitoring'
  );
  assert.equal(row('ttft-p95').current, 125.5);
  assert.equal(row('tpot-p95').current, 2.53);
  assert.equal(row('itl-p95').current, 5.51);
  assert.equal(row('latency-p95').current, 1.25);
  assert.equal(row('latency-p99').current, 1.75);
  assert.equal(cell('latency-p95', 'current'), '1,250 ms');
  assert.ok(
    table.dataSource
      .filter((item: any) => !item.peaks)
      .every((item: any) => item.label.startsWith('Client · '))
  );
});

test('P95 reads the selected successful stage distribution, respects real zero and leaves unsupported legacy observations unknown', () => {
  const current = {
    ...points[1],
    ttftP99: 999,
    raw: {
      ...points[1].raw,
      raw_metrics: {
        benchmarks: [
          {
            metrics: {
              time_to_first_token_ms: {
                successful: { count: 10, percentiles: { p95: 12 } }
              },
              inter_token_latency_ms: {
                successful: { count: 10, percentiles: { p95: 1.5 } }
              },
              inter_token_latency_per_chunk_ms: {
                successful: { count: 10, percentiles: { p95: 0 } }
              },
              request_latency: {
                successful: { count: 10, percentiles: { p95: 0.5 } }
              }
            }
          }
        ]
      }
    }
  };
  renderToStaticMarkup(
    createElement(StageComparison, {
      point: current,
      points: [points[0], current],
      baselineId: points[0].id,
      basis: 'custom',
      onBaseline() {},
      onShowBands() {},
      data: data(metric([])),
      dataForPoint: () => data(metric([])),
      onEvidence() {}
    })
  );
  assert.equal(row('ttft-p95').current, 12);
  assert.equal(row('tpot-p95').current, 1.5);
  assert.equal(row('itl-p95').current, 0);
  assert.equal(row('latency-p95').current, 0.5);
  assert.equal(row('ttft-p95').baseline, null);
  assert.equal(cell('ttft-p95', 'baseline'), '—');
  assert.equal(row('request-rate').baseline, null);
});

test('PD comparison exposes opposite Prefill and Decode waiting trends independently', () => {
  compare(
    data(
      metric([
        [{ role: 'prefill' }, 18, 250],
        [{ role: 'decode' }, 24, 260]
      ])
    ),
    data(
      metric([
        [{ role: 'prefill' }, 16, 150],
        [{ role: 'decode' }, 32, 160]
      ])
    )
  );
  assert.equal(row('waiting-prefill')?.current, 18);
  assert.equal(row('waiting-prefill')?.baseline, 16);
  assert.equal(cell('waiting-prefill', 'delta'), '+12.5 %');
  assert.equal(cell('waiting-decode', 'delta'), '-25.0 %');
  assert.match(cell('waiting-prefill', 'current'), /Prefill/);
  assert.match(cell('waiting-prefill', 'current'), /Peak time/);
  assert.equal(row('waiting'), undefined);
  assert.ok(row('kv-prefill'));
  assert.ok(row('kv-decode'));
});

test('a missing PD role stays missing while a real zero remains visible', () => {
  compare(
    data(metric([[{ role: 'decode' }, 0, 250]])),
    data(
      metric([
        [{ role: 'prefill' }, 16, 150],
        [{ role: 'decode' }, 32, 160]
      ])
    )
  );
  assert.equal(row('waiting-prefill')?.current, null);
  assert.equal(row('waiting-decode')?.current, 0);
  assert.equal(cell('waiting-prefill', 'delta'), '—');
  assert.equal(cell('waiting-decode', 'delta'), '-100.0 %');
});

test('GPU peak source changes keep both values and identities without implying a same-device delta', () => {
  const hardware = (device_id: string, peak: number, peak_at: number) => ({
    metrics: {},
    sample_statistics: {
      gpu_utilization: [
        { dimensions: { device_id, worker_id: 1 }, peak, peak_at }
      ]
    },
    devices: [
      {
        id: 'gpu-a',
        index: 0,
        name: 'GPU A',
        worker_id: 1,
        worker_name: 'worker-one'
      },
      {
        id: 'gpu-b',
        index: 1,
        name: 'GPU B',
        worker_id: 1,
        worker_name: 'worker-one'
      }
    ]
  });
  compare(
    data(null, context, hardware('gpu-b', 75, 250)),
    data(null, context, hardware('gpu-a', 90, 150))
  );
  assert.equal(row('gpu')?.current, 75);
  assert.equal(row('gpu')?.baseline, 90);
  assert.match(cell('gpu', 'delta'), /Peak source changed|peakSourceChanged/);
  assert.doesNotMatch(cell('gpu', 'delta'), /-15|pp/);
  assert.match(cell('gpu', 'current'), /GPU B/);
  assert.match(cell('gpu', 'baseline'), /GPU A/);
  assert.match(cell('gpu', 'current'), /worker-one/);
});

test('ordinary comparison stays compact and does not invent an identity for unattributed peaks', () => {
  const ordinary = { ...context, instances: [] };
  compare(
    data(metric([[{}, 5, 250]]), ordinary),
    data(metric([[{}, 10, 150]]), ordinary)
  );
  assert.equal(row('waiting')?.current, 5);
  assert.equal(row('waiting-prefill'), undefined);
  assert.match(
    cell('waiting', 'delta'),
    /Peak source unavailable|peakSourceUnavailable/
  );
  assert.doesNotMatch(cell('waiting', 'delta'), /-50/);
});
