import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let context: any;
const passthrough = ({ children }: any) =>
  createElement(Fragment, null, children);
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('antd', {
  namedExports: {
    Row: passthrough,
    Col: passthrough,
    Flex: ({ children, className }: any) =>
      createElement('div', { className }, children),
    Tooltip: ({ children, title }: any) =>
      createElement(Fragment, null, children, title),
    Typography: { Text: passthrough }
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({
      styles: { card: 'card', label: 'label', value: 'value', note: 'note' }
    })
  }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => context }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: { isPDModel: (model: any) => !!model.roles?.length }
});
const { default: PerformanceStats } = await import('../performance-stats');

const metric = (unit: string, values: number[], statistic = 'p99') => ({
  kind: 'histogram',
  unit,
  status: 'available',
  series: [],
  summaries: ['prefill', 'decode', 'router'].flatMap((role, index) => [
    { statistic, dimensions: { role }, value: values[index] },
    ...(statistic === 'p99'
      ? [{ statistic: 'p95', dimensions: { role }, value: values[index] / 10 }]
      : [])
  ])
});
const prepare = (instanceIds: number[]) => {
  context = {
    model: {
      data: {
        roles: [{ name: 'prefill' }, { name: 'decode' }, { name: 'router' }]
      }
    },
    instances: {
      data: [
        { id: 1, role: 'prefill' },
        { id: 2, role: 'decode' },
        { id: 3, role: 'router' }
      ]
    },
    scope: {
      instanceIds,
      role: 'all',
      latencyMetric: 'tpot',
      view: 'instances'
    },
    runtime: {
      data: {
        metrics: {
          ttft: metric('seconds', [0.01, 0.02, 0.03]),
          tpot: metric('seconds', [0.04, 0.05, 0.06]),
          itl: metric('seconds', [0.07, 0.08, 0.09]),
          running_requests: metric('requests', [11, 22, 33], 'current'),
          waiting_requests: metric('requests', [1, 2, 3], 'current')
        }
      }
    }
  };
};
const cards = () =>
  [
    ...new JSDOM(
      renderToStaticMarkup(createElement(PerformanceStats))
    ).window.document.querySelectorAll('.card')
  ].map((card) => ({
    label: card.querySelector('.label')?.textContent,
    value: card.querySelector('.value')?.textContent
  }));
for (const [name, ids, role, ttft, running, waiting] of [
  ['Prefill instance', [1], 'Prefill', '10ms', '11', '1'],
  ['Router instance', [3], 'Router', '30ms', '33', '3'],
  ['mixed instance roles', [1, 2], 'Decode', '20ms', '22', '2'],
  ['whole deployment', [], 'Decode', '20ms', '22', '2']
] as const) {
  test(`performance summary follows ${name} for requests and keeps TPOT Decode-local`, () => {
    prepare([...ids]);
    const stats = cards();
    assert.equal(stats[0].label, `${role} · TTFT`);
    assert.equal(stats[0].value, ttft);
    assert.equal(stats[1].value, '50ms/token');
    assert.equal(stats[3].value, `${running}requests`);
    assert.equal(stats[4].value, `${waiting}requests`);
  });
}
test('selecting ITL while inspecting Prefill does not borrow Prefill ITL observations', () => {
  prepare([1]);
  context.scope.latencyMetric = 'itl';
  assert.equal(cards()[1].value, '80ms');
});

test('empty KPI values share the chart reason, while idle gauges remain zero', () => {
  prepare([]);
  for (const key of ['ttft', 'tpot']) {
    const m = context.runtime.data.metrics[key];
    context.runtime.data.metrics[key] = {
      ...m,
      status: 'no_observations',
      reason: 'zero_observations',
      summaries: m.summaries.map((s: any) => ({
        ...s,
        value: null,
        sample_count: 0
      }))
    };
  }
  context.runtime.data.metrics.output_tokens = {
    unit: 'tokens_per_second',
    status: 'no_data',
    reason: 'no_samples',
    series: [],
    summaries: [
      { value: null, statistic: 'rate', dimensions: { role: 'decode' } }
    ]
  };
  for (const key of ['running_requests', 'waiting_requests'])
    context.runtime.data.metrics[key] = metric(
      'requests',
      [0, 0, 0],
      'current'
    );
  const document = new JSDOM(
    renderToStaticMarkup(createElement(PerformanceStats))
  ).window.document;
  const elements = [...document.querySelectorAll('.card')];
  assert.equal(elements[0].querySelector('.value')?.textContent, '—');
  assert.equal(
    elements[0].querySelector('.note')?.textContent,
    'modelMonitoring.state.zero_observations'
  );
  assert.equal(elements[2].querySelector('.value')?.textContent, '—');
  assert.equal(
    elements[2].querySelector('.note')?.textContent,
    'modelMonitoring.state.no_samples'
  );
  assert.equal(elements[3].querySelector('.value')?.textContent, '0requests');
  assert.equal(elements[4].querySelector('.value')?.textContent, '0requests');
});

test('an incomplete current-sample set cannot become a zero aggregate', () => {
  prepare([]);
  context.model.data = {};
  context.runtime.data.metrics.running_requests = {
    kind: 'gauge',
    unit: 'requests',
    status: 'available',
    reason: null,
    series: [],
    summaries: [
      { statistic: 'current', dimensions: { model_instance_id: 1 }, value: 0 },
      {
        statistic: 'current',
        dimensions: { model_instance_id: 2 },
        value: null
      }
    ]
  };
  const document = new JSDOM(
    renderToStaticMarkup(createElement(PerformanceStats))
  ).window.document;
  const card = document.querySelectorAll('.card')[3];
  assert.equal(card.querySelector('.value')?.textContent, '—');
  assert.equal(
    card.querySelector('.note')?.textContent,
    'modelMonitoring.summaryUnavailable'
  );
});

test('highest KV usage identifies its actual instance and DP while keeping legacy internal', () => {
  prepare([]);
  context.runtime.data.metrics.kv_usage = {
    unit: 'percent',
    summaries: [
      {
        value: 70,
        dimensions: {
          role: 'decode',
          model_instance_name: 'decode-a',
          source_name: 'legacy',
          endpoint_dp_rank: '1',
          dp_rank: '2'
        }
      }
    ]
  };
  const html = renderToStaticMarkup(createElement(PerformanceStats));
  assert.ok(html.includes('Decode · decode-a · Endpoint DP 1 · DP 2'));
  assert.ok(!html.includes('legacy'));
});

test('role-local latency help is only shown for a PD deployment', () => {
  prepare([]);
  assert.ok(
    renderToStaticMarkup(createElement(PerformanceStats)).includes(
      'modelMonitoring.localLatency'
    )
  );
  context.model.data.roles = [];
  assert.ok(
    !renderToStaticMarkup(createElement(PerformanceStats)).includes(
      'modelMonitoring.localLatency'
    )
  );
});

test('latency summary selects actual P99 values and matching scope labels', () => {
  prepare([]);
  const document = new JSDOM(
    renderToStaticMarkup(createElement(PerformanceStats))
  ).window.document;
  const elements = [...document.querySelectorAll('.card')];
  assert.equal(elements[0].querySelector('.value')?.textContent, '20ms');
  assert.equal(elements[1].querySelector('.value')?.textContent, '50ms/token');
  for (const card of elements.slice(0, 2)) {
    assert.match(card.querySelector('.note')?.textContent || '', /windowP99/);
    assert.doesNotMatch(card.textContent || '', /windowP95/);
  }
});

test('missing P99 observations do not silently fall back to P95', () => {
  prepare([]);
  for (const key of ['ttft', 'tpot']) {
    context.runtime.data.metrics[key].summaries = context.runtime.data.metrics[
      key
    ].summaries.filter((summary: any) => summary.statistic === 'p95');
  }
  const document = new JSDOM(
    renderToStaticMarkup(createElement(PerformanceStats))
  ).window.document;
  for (const card of [...document.querySelectorAll('.card')].slice(0, 2)) {
    assert.equal(card.querySelector('.value')?.textContent, '—');
    assert.equal(
      card.querySelector('.note')?.textContent,
      'modelMonitoring.summaryUnavailable'
    );
  }
});

test('headline P99 preserves a trusted quantile lower bound with its unit', () => {
  prepare([]);
  for (const key of ['ttft', 'tpot']) {
    const summary = context.runtime.data.metrics[key].summaries.find(
      (item: any) =>
        item.statistic === 'p99' && item.dimensions.role === 'decode'
    );
    summary.value = null;
    summary.lower_bound = 5;
  }
  const stats = cards();
  assert.equal(stats[0].value, '> 5,000ms');
  assert.equal(stats[1].value, '> 5,000ms/token');
});
