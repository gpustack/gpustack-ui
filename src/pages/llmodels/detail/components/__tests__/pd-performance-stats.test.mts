import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
let context: any;
let table: any;
const passthrough = ({ children }: any) =>
  createElement(Fragment, null, children);
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('antd', {
  namedExports: {
    Row: passthrough,
    Col: passthrough,
    Flex: passthrough,
    Button: passthrough,
    Tooltip: ({ children, title }: any) =>
      createElement(
        'span',
        { 'data-tooltip': true },
        children,
        createElement(
          'span',
          { 'data-tooltip-content': true, hidden: true },
          title
        )
      ),
    Typography: { Text: passthrough }
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    SectionTitle: passthrough,
    Table: (props: any) => {
      table = props;
      return null;
    }
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
const { default: PDPerformanceStats } = await import('../pd-performance-stats');
const { default: PDRoleOverview } = await import('../pd-role-overview');
const gauge = (
  kind: string,
  unit: string,
  values: Record<string, number | null>
) => ({
  kind,
  unit,
  status: 'available',
  measurement_scope: 'engine',
  reason: null,
  supported_statistics: [kind === 'counter' ? 'rate' : 'current'],
  series: [],
  summaries: Object.entries(values).map(([role, value]) => ({
    statistic: kind === 'counter' ? 'rate' : 'current',
    dimensions: { role },
    value
  }))
});
const latency = (scope: string, p99: number, role?: string) => ({
  kind: 'histogram',
  unit: 'seconds',
  status: 'available',
  reason: null,
  measurement_scope: scope,
  supported_statistics: ['p95', 'p99'],
  series: [],
  summaries: [
    { statistic: 'p99', dimensions: role ? { role } : {}, value: p99 },
    { statistic: 'p95', dimensions: role ? { role } : {}, value: p99 / 2 }
  ]
});
const prepare = () => {
  table = undefined;
  context = {
    model: {
      data: {
        roles: [
          { name: 'router', replicas: 1 },
          { name: 'prefill', replicas: 2 },
          { name: 'decode', replicas: 3 }
        ],
        role_status: {
          router: { ready: 1, desired: 1 },
          prefill: { ready: 1, desired: 2 },
          decode: { ready: 3, desired: 3 }
        },
        disaggregation: { mode: 'vllm-nixl' }
      }
    },
    instances: {
      loading: false,
      data: [
        { id: 1, role: 'prefill', name: 'prefill-a', worker_name: 'worker-a' },
        { id: 2, role: 'decode', name: 'decode-a', worker_name: 'worker-b' }
      ]
    },
    resources: {
      loading: false,
      data: {
        devices: [
          { id: 'gpu-a', worker_name: 'worker-a', model_instance_ids: [1] },
          { id: 'gpu-b', worker_name: 'worker-b', model_instance_ids: [2] }
        ]
      }
    },
    scope: { window: '1h' },
    runtime: {
      data: {
        metrics: {
          ttft: latency('engine_local', 9, 'decode'),
          input_tokens: gauge('counter', 'tokens_per_second', {
            prefill: 13,
            decode: 200,
            router: 900
          }),
          output_tokens: gauge('counter', 'tokens_per_second', {
            prefill: 11,
            decode: 20
          }),
          router_requests: gauge('counter', 'requests_per_second', {
            router: 5
          }),
          waiting_requests: gauge('gauge', 'requests', {
            prefill: 3,
            decode: 8,
            router: 99
          }),
          kv_usage: gauge('gauge', 'percent', { prefill: 20, decode: 60 })
        }
      }
    },
    setTab() {},
    openMonitoringSection() {}
  };
};
const cards = () => {
  const document = new JSDOM(
    renderToStaticMarkup(createElement(PDPerformanceStats))
  ).window.document;
  return (key: string) => document.querySelector(`[data-pd-kpi="${key}"]`)!;
};
test('PD service summary never labels local Decode TTFT as ingress experience', () => {
  prepare();
  const card = cards();
  assert.equal(card('ingressTTFT').querySelector('.value')?.textContent, '—');
  assert.equal(
    card('ingressTTFT').querySelector('.note')?.textContent,
    'modelMonitoring.pd.ingressUnavailable'
  );
  assert.equal(card('ingressE2E').querySelector('.value')?.textContent, '—');
});
test('PD headline source is checked before reading its actual P99 summary', () => {
  prepare();
  context.runtime.data.metrics.ingress_ttft = latency('service_ingress', 0.12);
  context.runtime.data.metrics.ingress_e2e = latency(
    'engine_local',
    4,
    'decode'
  );
  const card = cards();
  assert.equal(
    card('ingressTTFT').querySelector('.value')?.textContent,
    '120ms'
  );
  assert.match(
    card('ingressTTFT').querySelector('[data-tooltip-content]')?.textContent ||
      '',
    /modelMonitoring.windowP99.*modelMonitoring.pd.ingressHelp/
  );
  assert.equal(card('ingressE2E').querySelector('.value')?.textContent, '—');
});

test('a trusted service P99 lower bound is readable in the headline instead of a missing value', () => {
  prepare();
  context.runtime.data.metrics.ingress_ttft = {
    ...latency('service_ingress', 5),
    summaries: [
      { statistic: 'p99', dimensions: {}, value: null, lower_bound: 5 }
    ]
  };
  const card = cards()('ingressTTFT');
  assert.equal(card.querySelector('.value')?.textContent, '> 5,000ms');
  assert.equal(card.querySelector('.note'), null);
});
test('gateway sum/count averages are displayed as Avg without inventing P99', () => {
  prepare();
  for (const key of ['ingress_ttft', 'ingress_e2e']) {
    context.runtime.data.metrics[key] = {
      ...latency('service_ingress', 9),
      supported_statistics: ['avg'],
      summaries: [
        {
          statistic: 'avg',
          dimensions: { source_name: 'gateway' },
          value: 0.12
        }
      ]
    };
  }
  const card = cards();
  assert.equal(
    card('ingressTTFT').querySelector('.value')?.textContent,
    '120ms'
  );
  assert.equal(
    card('ingressE2E').querySelector('.value')?.textContent,
    '120ms'
  );
  assert.equal(card('ingressTTFT').querySelector('.note'), null);
  assert.match(
    card('ingressTTFT').querySelector('[data-tooltip-content]')?.textContent ||
      '',
    /modelMonitoring.windowAverage.*modelMonitoring.pd.ingressHelp/
  );
});
test('PD summary counts stay within P, D and Router without double counting requests', () => {
  prepare();
  const card = cards();
  assert.equal(
    card('input')?.querySelector('.value')?.textContent,
    '13token/s'
  );
  assert.equal(
    card('output').querySelector('.value')?.textContent,
    '20token/s'
  );
  assert.equal(
    card('routerRequests').querySelector('.value')?.textContent,
    '5req/s'
  );
  assert.equal(
    card('pWaiting').querySelector('.value')?.textContent,
    '3requests'
  );
  assert.equal(
    card('dWaiting').querySelector('.value')?.textContent,
    '8requests'
  );
});
test('Prefill input throughput sums all Prefill members and retains its window-average explanation in help', () => {
  prepare();
  const input = context.runtime.data.metrics.input_tokens;
  input.summaries = [
    {
      statistic: 'rate',
      dimensions: { role: 'prefill', instance_id: 1 },
      value: 12
    },
    {
      statistic: 'rate',
      dimensions: { role: 'prefill', instance_id: 2 },
      value: 8
    },
    {
      statistic: 'rate',
      dimensions: { role: 'decode', instance_id: 3 },
      value: 999
    }
  ];
  const card = cards()('input');
  assert.equal(card?.querySelector('.value')?.textContent, '20token/s');
  assert.equal(card?.querySelector('.note'), null);
  assert.match(
    card?.querySelector('[data-tooltip-content]')?.textContent || '',
    /modelMonitoring.windowAverage.*modelMonitoring.pd.prefillResponsibility/
  );
});
test('Prefill throughput preserves observed zero and never borrows Decode input when Prefill is absent', () => {
  prepare();
  context.runtime.data.metrics.input_tokens = gauge(
    'counter',
    'tokens_per_second',
    {
      prefill: 0,
      decode: 999
    }
  );
  assert.equal(
    cards()('input')?.querySelector('.value')?.textContent,
    '0token/s'
  );
  context.runtime.data.metrics.input_tokens = gauge(
    'counter',
    'tokens_per_second',
    {
      decode: 999
    }
  );
  assert.equal(cards()('input')?.querySelector('.value')?.textContent, '—');
  delete context.runtime.data.metrics.input_tokens;
  assert.equal(cards()('input')?.querySelector('.value')?.textContent, '—');
});
test('missing samples are not filled with zero while observed idle gauges remain zero', () => {
  prepare();
  context.runtime.data.metrics.waiting_requests = gauge('gauge', 'requests', {
    prefill: null,
    decode: 0
  });
  const card = cards();
  assert.equal(card('pWaiting').querySelector('.value')?.textContent, '—');
  assert.equal(
    card('dWaiting').querySelector('.value')?.textContent,
    '0requests'
  );
  assert.equal(card('dWaiting').querySelector('.note'), null);
  assert.match(
    card('dWaiting').querySelector('[data-tooltip-content]')?.textContent || '',
    /modelMonitoring.current.*modelMonitoring.pd.poolCurrent/
  );
});
test('custom end-sample scope remains in help and query failures stay beside the missing value', () => {
  prepare();
  context.scope = { start: 100, end: 200 };
  context.runtime.data.metrics.input_tokens = {
    ...context.runtime.data.metrics.input_tokens,
    status: 'query_error',
    reason: 'query_failed',
    summaries: []
  };
  const card = cards();
  assert.equal(card('input').querySelector('.value')?.textContent, '—');
  assert.equal(
    card('input').querySelector('.note')?.textContent,
    'modelMonitoring.state.query_failed'
  );
  assert.match(
    card('pWaiting').querySelector('[data-tooltip-content]')?.textContent || '',
    /modelMonitoring.selectedEnd.*modelMonitoring.pd.poolCurrent/
  );
});
test('compact role overview moves responsibility into role help while keeping host and readiness visible', () => {
  prepare();
  const document = new JSDOM(
    renderToStaticMarkup(createElement(PDRoleOverview))
  ).window.document;
  const help = [...document.querySelectorAll('[data-tooltip-content]')];
  assert.deepEqual(
    help.map((content) => content.textContent),
    ['router', 'prefill', 'decode'].map(
      (role) => `modelMonitoring.pd.${role}Responsibility`
    )
  );
  for (const content of help) content.remove();
  assert.doesNotMatch(document.body.textContent || '', /Responsibility/);
  assert.match(document.body.textContent || '', /worker-a · 1 GPU/);
  assert.match(document.body.textContent || '', /1 \/ 2/);
});
test('role overview uses desired readiness and associates devices only with their role members', () => {
  prepare();
  renderToStaticMarkup(createElement(PDRoleOverview, { variant: 'table' }));
  assert.equal(table.loading, false);
  assert.deepEqual(
    table.dataSource.map((row: any) => [
      row.role,
      row.ready,
      row.resources,
      row.waiting,
      row.kv
    ]),
    [
      ['router', '1 / 1', '—', 99, null],
      ['prefill', '1 / 2', 'worker-a · 1 GPU', 3, 20],
      ['decode', '3 / 3', 'worker-b · 1 GPU', 8, 60]
    ]
  );
});
test('compact monitoring topology avoids adding another association table', () => {
  prepare();
  const html = renderToStaticMarkup(
    createElement(PDRoleOverview, { variant: 'monitoring' })
  );
  assert.equal(table, undefined);
  assert.ok(html.includes('Prefill'));
  assert.ok(html.includes('Decode'));
});
