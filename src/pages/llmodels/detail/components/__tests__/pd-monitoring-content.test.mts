import messages from '@/locales/en-US/model-monitoring';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ModelMetric, Statistic } from '../../config/types';
import type {
  PDChartSpec,
  PDMonitoringContentProps
} from '../pd-monitoring-content';

const strings = (messages as any).default || messages;

const actualAntd = await import('antd');
let detailControls: {
  key: string;
  activeKey: string[];
  onChange: (keys: string[]) => void;
}[] = [];
mock.module('antd', {
  namedExports: {
    ...actualAntd,
    Collapse: ({ items, activeKey, onChange }: any) => {
      detailControls.push({ key: items[0].key, activeKey, onChange });
      return createElement(
        'div',
        {},
        items.map((item: any) =>
          createElement(
            'details',
            { key: item.key },
            createElement('summary', {}, item.label),
            item.children
          )
        )
      );
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }) => strings[id] || id
    })
  }
});
let tableRows: any[] = [];
mock.module('@gpustack/core-ui', {
  namedExports: {
    SectionTitle: ({ children }: any) => createElement('h3', {}, children),
    TextAttribute: ({ children }: any) => createElement('span', {}, children),
    Table: ({ dataSource }: any) => {
      tableRows = dataSource;
      return createElement(
        'div',
        { 'data-members': true },
        dataSource.map((row: any) => row.instance).join(', ')
      );
    }
  }
});
mock.module(new URL('../hardware-content.tsx', import.meta.url).href, {
  namedExports: {
    combineMetrics: (entries: any[]) => {
      const present = entries.filter(([, metric]) => metric);
      return present.length
        ? {
            ...present[0][1],
            series: present.flatMap(([name, metric]) =>
              metric.series.map((series: any) => ({
                ...series,
                name: `${name} · ${series.name}`
              }))
            ),
            summaries: present.flatMap(([, metric]) => metric.summaries)
          }
        : undefined;
    }
  }
});
mock.module(new URL('../help-tooltip.tsx', import.meta.url).href, {
  defaultExport: ({ label, content }: any) =>
    createElement('button', { 'aria-label': label, title: content }, '?')
});
mock.module(new URL('../metric-state.tsx', import.meta.url).href, {
  namedExports: {
    MetricNotice: () => null,
    MetricState: () => createElement('span', {}, 'No observations')
  }
});
const { default: PDMonitoringContent } =
  await import('../pd-monitoring-content');

const metric = (
  kind: ModelMetric['kind'] = 'histogram',
  scope = 'engine_local'
): ModelMetric => ({
  kind,
  unit:
    kind === 'histogram'
      ? 'seconds'
      : kind === 'counter'
        ? 'tokens_per_second'
        : 'requests',
  measurement_scope: scope,
  status: 'available',
  reason: null,
  supported_statistics: kind === 'counter' ? ['rate'] : ['avg', 'p99'],
  series: ['prefill', 'decode', 'router'].flatMap((role, index) =>
    (kind === 'counter' ? ['rate'] : ['avg', 'p99']).map((statistic) => ({
      name: role,
      statistic: statistic as Statistic,
      dimensions: { role, model_instance_id: index + 1 },
      points: [[100, 10 + index]] as [number, number | null][]
    }))
  ),
  summaries: ['prefill', 'decode', 'router'].map((role, index) => ({
    statistic: kind === 'counter' ? 'rate' : 'p99',
    dimensions: { role, model_instance_id: index + 1 },
    value: 10 + index
  }))
});
const instances = [
  { id: 1, name: 'prefill-a', role: 'prefill', state: 'running' },
  { id: 2, name: 'decode-a', role: 'decode', state: 'running' },
  { id: 3, name: 'router-a', role: 'router', state: 'running' }
];
const metrics: Record<string, ModelMetric> = Object.fromEntries(
  [
    'prefill',
    'decode',
    'tpot',
    'itl',
    'ttft',
    'e2e',
    'queue',
    'input_tokens',
    'output_tokens',
    'prefix_cache_hit_rate',
    'external_cache_hit_rate',
    'running_requests',
    'waiting_requests',
    'kv_usage',
    'pd_kv_transfer',
    'pd_kv_completion',
    'pd_kv_throughput',
    'pd_kv_transfer_failures',
    'pd_kv_bootstrap_failures',
    'pd_kv_expired',
    'pd_kv_transfer_post',
    'pd_kv_allocation',
    'pd_prefill_bootstrap_queue',
    'pd_prefill_inflight_queue',
    'pd_decode_prealloc_queue',
    'pd_decode_transfer_queue',
    'pd_kv_transfer_bytes',
    'pd_kv_transfer_speed',
    'router_requests',
    'router_request_duration'
  ].map((key) => [
    key,
    metric(
      ['input_tokens', 'output_tokens'].includes(key)
        ? 'counter'
        : key.endsWith('_queue') ||
            ['running_requests', 'waiting_requests', 'kv_usage'].includes(key)
          ? 'gauge'
          : 'histogram'
    )
  ])
);
function render(overrides: Partial<PDMonitoringContentProps> = {}) {
  const specs: PDChartSpec[] = [];
  tableRows = [];
  detailControls = [];
  const props: PDMonitoringContentProps = {
    metrics,
    instances,
    backend: 'vllm',
    view: 'aggregate',
    onViewChange: () => {},
    renderChart: (spec) => {
      specs.push(spec);
      return createElement('div', { 'data-chart-spec': spec.key }, spec.title);
    },
    ...overrides
  };
  const html = renderToStaticMarkup(createElement(PDMonitoringContent, props));
  return { html, specs };
}

test('deployment and Benchmark place Router rate and P/D throughput together in the primary section', () => {
  for (const backend of ['vllm', 'sglang'])
    for (const view of ['aggregate', 'instances'] as const)
      for (const omitUnavailable of [false, true]) {
        const { html, specs } = render({ backend, view, omitUnavailable });
        const document = new JSDOM(html).window.document;
        const input = document.querySelector(
          '[data-pd-metric="prefill-input_tokens"]'
        )!;
        const output = document.querySelector(
          '[data-pd-metric="decode-output_tokens"]'
        )!;
        assert.equal(
          input
            .closest('[data-monitoring-section]')
            ?.getAttribute('data-monitoring-section'),
          'pools'
        );
        assert.equal(
          output
            .closest('[data-monitoring-section]')
            ?.getAttribute('data-monitoring-section'),
          'pools'
        );
        assert.equal(input.parentElement, output.parentElement);
        assert.equal(input.nextElementSibling, output);
        assert.ok(input.classList.contains('ant-col-xl-8'));
        assert.ok(output.classList.contains('ant-col-xl-8'));
        const router = document.querySelector(
          '[data-pd-metric="router-router_requests"]'
        )!;
        assert.equal(router.nextElementSibling, input);
        assert.equal(router.parentElement, output.parentElement);
        for (const [key, role] of [
          ['prefill-input_tokens', 'prefill'],
          ['decode-output_tokens', 'decode']
        ] as const) {
          const charts = specs.filter((spec) => spec.key === key);
          assert.equal(
            charts.length,
            1,
            `${backend}/${view}: ${key} is never duplicated`
          );
          assert.equal(charts[0].metric?.kind, 'counter');
          assert.ok(
            charts[0].metric!.series.every(
              (series) => series.dimensions.role === role
            )
          );
        }
        const detail = document.querySelector(
          '[data-monitoring-section="role-details"]'
        )!;
        assert.match(detail.textContent || '', /Cache observations/);
        assert.doesNotMatch(detail.textContent || '', /Throughput/);
        assert.equal(detail.querySelector('[data-pd-metric$="tokens"]'), null);
        const pTiming = document.querySelector(
          '[data-pd-metric="prefill-request-timing"]'
        )!;
        const dTiming = document.querySelector(
          '[data-pd-metric="decode-request-timing"]'
        )!;
        assert.equal(pTiming.nextElementSibling, dTiming);
        assert.equal(
          pTiming
            .closest('[data-monitoring-section]')
            ?.getAttribute('data-monitoring-section'),
          'pools'
        );
        assert.ok(
          document
            .querySelector('[data-pd-metric="decode-tpot"]')
            ?.classList.contains('ant-col-xl-12')
        );
        const tpot = document.querySelector('[data-pd-metric="decode-tpot"]')!;
        const itl = document.querySelector('[data-pd-metric="decode-itl"]')!;
        assert.equal(tpot.nextElementSibling, itl);
        assert.equal(
          tpot.parentElement?.previousElementSibling?.querySelector(
            '[data-pd-metric="decode-output_tokens"]'
          ) != null,
          true
        );
        assert.equal(
          tpot.parentElement?.nextElementSibling?.querySelector(
            '[data-pd-metric="prefill-queues"]'
          ) != null,
          true
        );
      }
});

test('throughput capability omission preserves missing responses, errors and role-local empty observations', () => {
  for (const backend of ['vllm', 'sglang'])
    for (const view of ['aggregate', 'instances'] as const) {
      for (const status of [
        'unsupported',
        'not_applicable',
        'query_error',
        'restricted',
        'no_data'
      ] as const) {
        const unavailable = {
          ...metric('counter'),
          status,
          series: [],
          summaries: []
        };
        const { specs } = render({
          backend,
          view,
          omitUnavailable: true,
          metrics: {
            ...metrics,
            input_tokens: unavailable,
            output_tokens: unavailable
          }
        });
        const pair = specs.filter((spec) =>
          ['prefill-input_tokens', 'decode-output_tokens'].includes(spec.key)
        );
        assert.equal(
          pair.length,
          ['unsupported', 'not_applicable'].includes(status) ? 0 : 2
        );
        assert.ok(pair.every((spec) => spec.metric?.status === status));
      }
      const missing = { ...metrics };
      delete missing.input_tokens;
      delete missing.output_tokens;
      const { specs: absent } = render({
        backend,
        view,
        omitUnavailable: true,
        metrics: missing
      });
      for (const key of ['prefill-input_tokens', 'decode-output_tokens']) {
        const chart = absent.find((spec) => spec.key === key)!;
        assert.equal(chart.metric?.status, 'unsupported');
        assert.equal(chart.metric?.unit, 'tokens_per_second');
        assert.deepEqual(chart.metric?.series, []);
      }
      const wrongRoles = metric('counter');
      wrongRoles.series = wrongRoles.series.filter(
        (series) => series.dimensions.role === 'router'
      );
      wrongRoles.summaries = wrongRoles.summaries.filter(
        (summary) => summary.dimensions.role === 'router'
      );
      const { specs: empty } = render({
        backend,
        view,
        omitUnavailable: true,
        metrics: {
          ...metrics,
          input_tokens: wrongRoles,
          output_tokens: wrongRoles
        }
      });
      for (const key of ['prefill-input_tokens', 'decode-output_tokens']) {
        const chart = empty.find((spec) => spec.key === key)!;
        assert.equal(chart.metric?.status, 'no_data');
        assert.deepEqual(chart.metric?.series, []);
        assert.deepEqual(chart.metric?.summaries, []);
      }
    }
});

test('available throughput keeps the primary pool visible while unsupported cache and timing details are omitted', () => {
  const unsupported = {
    ...metric(),
    status: 'unsupported' as const,
    reason: 'metric_not_provided',
    series: [],
    summaries: []
  };
  const throughputOnly = {
    ...Object.fromEntries(
      Object.keys(metrics).map((key) => [key, unsupported])
    ),
    input_tokens: metric('counter'),
    output_tokens: metric('counter')
  };
  for (const backend of ['vllm', 'sglang']) {
    const { html, specs } = render({
      backend,
      omitUnavailable: true,
      metrics: throughputOnly
    });
    assert.ok(html.includes('data-monitoring-section="pools"'));
    assert.ok(!html.includes('data-monitoring-section="role-details"'));
    assert.deepEqual(
      specs
        .filter((spec) =>
          ['prefill-input_tokens', 'decode-output_tokens'].includes(spec.key)
        )
        .map((spec) => spec.key),
      ['prefill-input_tokens', 'decode-output_tokens']
    );
  }
});

test('service placeholders never substitute engine TTFT; section anchors and compact unavailable source remain explicit', () => {
  const { html, specs } = render({
    sectionIds: {
      service: 'pd-service',
      pools: 'pd-pools',
      handoff: 'pd-handoff'
    }
  });
  assert.ok(html.includes('Not collected at the service ingress'));
  assert.ok(!specs.some((spec) => spec.key.startsWith('ingress-')));
  for (const id of ['pd-service', 'pd-pools', 'pd-handoff'])
    assert.ok(html.includes(`id="${id}"`));
  const realIngress = { ...metric(), measurement_scope: 'service_ingress' };
  const withIngress = render({
    metrics: { ...metrics, ingress_ttft: realIngress }
  });
  assert.equal(
    withIngress.specs.find((spec) => spec.key === 'ingress-ttft')?.metric,
    realIngress
  );
});

test('P and D charts retain separate observations without an instance focus filter', () => {
  const { specs, html } = render({ view: 'instances' });
  assert.doesNotMatch(html, /aria-label="Focus instance/);
  assert.doesNotMatch(html, /Focused instance|Clear focus/);
  const prefill = specs.find((spec) => spec.key === 'prefill-request-timing')!;
  const decode = specs.find((spec) => spec.key === 'decode-tpot')!;
  assert.equal(prefill.title, 'Prefill · Request timing comparison');
  assert.ok(prefill.help.includes('percentiles'));
  assert.ok(
    prefill.metric!.series.every(
      (series) => series.dimensions.role === 'prefill'
    )
  );
  assert.ok(
    decode.metric!.series.every((series) => series.dimensions.role === 'decode')
  );
  assert.ok(specs.every((spec) => !('focus' in spec)));
  assert.equal(decode.metricKey, 'tpot', 'TPOT retains per-token units');
  for (const role of ['prefill', 'decode']) {
    const queues = specs.find((spec) => spec.key === `${role}-queues`)!;
    assert.equal(queues.measures?.length, 2);
    assert.ok(
      queues.metric!.series.every((series) => series.dimensions.role === role)
    );
  }
});

test('by-instance charts include every member of the matching role, and connector charts retain all related roles', () => {
  const population = instances.flatMap((instance) => [
    instance,
    { ...instance, id: instance.id + 10, name: `${instance.name}-second` }
  ]);
  const expanded = Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [
      key,
      {
        ...value,
        series: value.series.flatMap((series) => [
          series,
          {
            ...series,
            dimensions: {
              ...series.dimensions,
              model_instance_id: series.dimensions.model_instance_id! + 10
            }
          }
        ])
      }
    ])
  );
  const { specs } = render({
    view: 'instances',
    instances: population,
    metrics: expanded
  });
  for (const [key, ids] of [
    ['prefill-input_tokens', [1, 11]],
    ['decode-output_tokens', [2, 12]],
    ['prefill-request-timing', [1, 11]],
    ['decode-tpot', [2, 12]],
    ['router-router_requests', [3, 13]],
    ['pd_kv_completion', [1, 11, 2, 12, 3, 13]]
  ] as const) {
    const chart = specs.find((spec) => spec.key === key)!;
    assert.deepEqual(
      [
        ...new Set(
          chart.metric!.series.map((s) => s.dimensions.model_instance_id)
        )
      ],
      ids
    );
  }
});

test('by-instance local latency retains all original statistics for the shared control while role throughput/cache remain present', () => {
  const { specs } = render({ view: 'instances' });
  for (const key of [
    'prefill-request-timing',
    'decode-tpot',
    'decode-itl',
    'decode-request-timing'
  ]) {
    assert.deepEqual(
      specs
        .find((spec) => spec.key === key)
        ?.metric?.series.map((series) => series.statistic)
        .filter((value, index, values) => values.indexOf(value) === index),
      ['avg', 'p99']
    );
  }
  for (const key of [
    'prefill-input_tokens',
    'decode-output_tokens',
    'prefill-external_cache_hit_rate',
    'decode-external_cache_hit_rate'
  ])
    assert.ok(specs.some((spec) => spec.key === key));
});

test('SGLang handoff is flat, showing real transfer completion and separate P/D backlog without bootstrap or allocation charts', () => {
  const { specs, html } = render({
    backend: 'sglang',
    metrics: {
      ...metrics,
      pd_kv_transfer: {
        ...metrics.pd_kv_transfer,
        measurement_scope: 'bootstrap_handshake'
      }
    }
  });
  assert.ok(!specs.some((spec) => spec.key === 'prefill-prefill'));
  assert.ok(specs.some((spec) => spec.key === 'prefill-input_tokens'));
  assert.equal(
    specs.find((spec) => spec.key === 'pd_kv_completion')!.title,
    'KV transfer completion duration'
  );
  assert.ok(specs.some((spec) => spec.key === 'pd_kv_throughput'));
  for (const role of ['prefill', 'decode']) {
    const backlog = specs.find(
      (spec) => spec.key === `${role}-handoff-backlog`
    )!;
    assert.ok(
      backlog.metric!.series.every((series) => series.dimensions.role === role)
    );
    assert.equal(backlog.measures!.length, 2);
  }
  for (const key of [
    'pd_kv_transfer',
    'pd_kv_transfer_post',
    'pd_kv_allocation',
    'pd_kv_transfer_bytes',
    'pd_kv_transfer_speed',
    'pd-stage-queues'
  ])
    assert.ok(!specs.some((spec) => spec.key === key), key);
  assert.ok(!html.includes('data-monitoring-section="handoff-details"'));
});

test('vLLM handoff contains completion and wall-time byte throughput without SGLang queues or technical detail folds', () => {
  const { specs, html } = render();
  const handoff = specs.filter(
    (spec) => spec.key.startsWith('pd_') || spec.key.includes('handoff-backlog')
  );
  assert.deepEqual(
    handoff.map((spec) => spec.key),
    ['pd_kv_completion', 'pd_kv_throughput']
  );
  assert.equal(handoff[1].metricKey, 'pd_kv_throughput');
  assert.ok(!html.includes('data-monitoring-section="handoff-details"'));
});

test('a legacy SGLang handshake is never relabeled as transfer completion', () => {
  const legacy = { ...metrics };
  delete legacy.pd_kv_completion;
  legacy.pd_kv_transfer = {
    ...legacy.pd_kv_transfer,
    measurement_scope: 'bootstrap_handshake'
  };
  const { specs } = render({ backend: 'sglang', metrics: legacy });
  assert.ok(!specs.some((spec) => spec.metric === legacy.pd_kv_transfer));
});

test('Router member display resolves upstream identity separately from observer role', () => {
  render({
    metrics: {
      ...metrics,
      router_health: {
        ...metric('gauge'),
        series: [],
        summaries: [
          {
            statistic: 'current',
            value: 1,
            dimensions: {
              role: 'router',
              model_instance_id: 3,
              upstream_instance_id: 1
            }
          }
        ]
      }
    }
  });
  assert.equal(tableRows.length, 1);
  assert.equal(tableRows[0].instance, 'prefill-a');
  assert.equal(tableRows[0].role, 'prefill');
  assert.equal(tableRows[0].observer, 'router-a');
});

test('controlled detail navigation opens the requested fold and preserves other expanded evidence', () => {
  let next: string[] = [];
  render({
    expandedSections: ['pools'],
    expandedDetails: ['role-details', 'handoff-details'],
    onExpandedDetailsChange: (keys) => {
      next = keys;
    },
    sectionIds: { details: 'pd-more' }
  });
  assert.deepEqual(
    detailControls.find((item) => item.key === 'role-details')!.activeKey,
    ['role-details']
  );
  assert.ok(!detailControls.some((item) => item.key === 'router'));
  assert.ok(!detailControls.some((item) => item.key === 'handoff-details'));
  detailControls.find((item) => item.key === 'role-details')!.onChange([]);
  assert.deepEqual(next, ['handoff-details']);
});

test('Router rate belongs to the primary role section and remains visible when P/D metrics are unavailable', async () => {
  const { JSDOM } = await import('jsdom');
  let next: string[] = [];
  const { html } = render({
    expandedSections: ['pools', 'pd', 'gpu'],
    onExpandedSectionsChange: (keys) => {
      next = keys;
    },
    sectionIds: { pools: 'pools-target', handoff: 'kv-target' }
  });
  const document = new JSDOM(html).window.document;
  assert.equal(
    document.querySelector('[data-monitoring-section="router"]'),
    null
  );
  const router = document.querySelector(
    '[data-pd-metric="router-router_requests"]'
  )!;
  assert.equal(router.closest('[data-monitoring-section]')?.id, 'pools-target');
  assert.deepEqual(
    [...document.querySelectorAll('[data-monitoring-level="primary"]')].map(
      (e) => e.getAttribute('data-monitoring-section')
    ),
    ['pools', 'service', 'pd']
  );
  detailControls.find((item) => item.key === 'pools')!.onChange([]);
  assert.deepEqual(next, ['pd', 'gpu']);
  const unsupported = {
    ...metric(),
    status: 'unsupported' as const,
    reason: 'metric_not_provided',
    series: [],
    summaries: []
  };
  const routerOnly = Object.fromEntries(
    Object.keys(metrics).map((key) => [key, unsupported])
  );
  const result = render({
    omitUnavailable: true,
    metrics: {
      ...routerOnly,
      ingress_ttft: unsupported,
      ingress_e2e: unsupported,
      router_requests: metric('counter'),
      router_request_duration: metric(),
      router_health: unsupported
    }
  });
  assert.ok(result.html.includes('data-monitoring-section="pools"'));
  assert.ok(!result.html.includes('data-monitoring-section="router"'));
  assert.ok(!result.html.includes('data-monitoring-section="pd"'));
  assert.deepEqual(
    result.specs.map((spec) => spec.key),
    ['router-router_requests']
  );
});

test('uncollected service latency uses one compact notice instead of two empty charts', () => {
  const { html, specs } = render();
  assert.equal((html.match(/data-pd-ingress-unavailable/g) || []).length, 1);
  assert.equal(
    specs.filter((spec) => spec.key.startsWith('ingress')).length,
    0
  );
});

test('primary section controls preserve hardware expansion when collapsing a role pool', () => {
  let next: string[] = [];
  render({
    expandedSections: ['service', 'pools', 'pd', 'gpu'],
    onExpandedSectionsChange: (keys) => {
      next = keys;
    }
  });
  detailControls.find((item) => item.key === 'pools')!.onChange([]);
  assert.deepEqual(next, ['service', 'pd', 'gpu']);
  render({ expandedSections: [] });
  for (const key of ['service', 'pools', 'pd'])
    assert.deepEqual(
      detailControls.find((item) => item.key === key)!.activeKey,
      []
    );
});

test('PD content orders the role pool before ingress and keeps handoff details closed by default', () => {
  render({
    metrics: {
      ...metrics,
      ingress_ttft: { ...metric(), measurement_scope: 'service_ingress' }
    }
  });
  const primary = detailControls.filter((item) =>
    ['pools', 'service', 'pd'].includes(item.key)
  );
  assert.deepEqual(
    primary.map((item) => item.key),
    ['pools', 'service', 'pd']
  );
  assert.deepEqual(
    primary.flatMap((item) => item.activeKey),
    ['pools', 'service']
  );
  for (const key of ['role-details']) {
    assert.deepEqual(
      detailControls.find((item) => item.key === key)?.activeKey,
      []
    );
  }
});

test('SGLang main handoff chart keeps four separate role-local queue observations', () => {
  const queueMetrics = Object.fromEntries(
    [
      'pd_prefill_bootstrap_queue',
      'pd_prefill_inflight_queue',
      'pd_decode_prealloc_queue',
      'pd_decode_transfer_queue'
    ].map((key) => {
      const value = metric('gauge');
      return [
        key,
        {
          ...value,
          series: value.series
            .filter((series) => series.statistic === 'p99')
            .map((series) => ({ ...series, statistic: 'current' }))
        }
      ];
    })
  );
  const { specs } = render({
    backend: 'sglang',
    metrics: { ...metrics, ...queueMetrics }
  });
  for (const role of ['prefill', 'decode']) {
    const queues = specs.find(
      (spec) => spec.key === `${role}-handoff-backlog`
    )!;
    assert.equal(queues.metric?.kind, 'gauge');
    assert.deepEqual(
      queues.metric?.series.map((series) => series.dimensions.role),
      [role, role]
    );
  }
  assert.ok(specs.find((spec) => spec.key === 'prefill-prefill') === undefined);
});

test('deployment and Benchmark omission removes unsupported Router health without removing available Router charts', () => {
  const unsupported = {
    ...metric(),
    status: 'unsupported' as const,
    reason: 'metric_not_provided',
    series: [],
    summaries: []
  };
  const { html, specs } = render({
    omitUnavailable: true,
    metrics: {
      ...metrics,
      ingress_ttft: unsupported,
      ingress_e2e: unsupported,
      router_health: unsupported
    }
  });
  assert.doesNotMatch(
    html,
    /Router upstream member state|data-pd-ingress-unavailable|Service experience/
  );
  assert.ok(specs.some((spec) => spec.key === 'router-router_requests'));
  assert.ok(
    !specs.some((spec) => spec.key === 'router-router_request_duration')
  );
});

test('agreed simplification removes local TTFT and Router timing while retaining role E2E and Decode duration', () => {
  const { specs } = render();
  for (const key of [
    'prefill-ttft',
    'decode-ttft',
    'router-router_request_duration'
  ])
    assert.ok(!specs.some((spec) => spec.key === key));
  for (const key of ['prefill-request-timing', 'decode-request-timing'])
    assert.ok(
      specs.some((spec) => spec.key === key),
      key
    );
  const unsupported = {
    ...metric(),
    status: 'unsupported' as const,
    reason: 'metric_not_provided',
    series: [],
    summaries: []
  };
  const onlyTimer = render({
    omitUnavailable: true,
    metrics: {
      ...metrics,
      router_requests: unsupported,
      router_health: unsupported
    }
  });
  assert.ok(
    !onlyTimer.html.includes('data-monitoring-section="router"'),
    'an unused duration metric cannot keep an empty Router section alive'
  );
});

test('only explicitly disabled role caches disappear; enabled zero, unknown history, errors and role timing remain visible', () => {
  const features = {
    prefill: { prefix: false, external: false },
    decode: { prefix: true, external: false }
  };
  const empty = {
    ...metrics.external_cache_hit_rate,
    status: 'no_data' as const,
    reason: 'no_samples',
    series: [],
    summaries: []
  };
  const decodeOnly = {
    ...metrics.prefix_cache_hit_rate,
    series: metrics.prefix_cache_hit_rate.series.filter(
      (item) => item.dimensions.role === 'decode'
    ),
    summaries: metrics.prefix_cache_hit_rate.summaries.filter(
      (item) => item.dimensions.role === 'decode'
    )
  };
  const { specs } = render({
    cacheFeatures: features,
    metrics: {
      ...metrics,
      prefix_cache_hit_rate: decodeOnly,
      external_cache_hit_rate: empty
    }
  });
  assert.ok(
    !specs.some((spec) => spec.key === 'prefill-prefix_cache_hit_rate')
  );
  assert.ok(specs.some((spec) => spec.key === 'decode-prefix_cache_hit_rate'));
  assert.ok(
    !specs.some((spec) => spec.key.endsWith('-external_cache_hit_rate'))
  );
  for (const key of ['prefill-request-timing', 'decode-request-timing'])
    assert.ok(
      specs.some((spec) => spec.key === key),
      key
    );
  const zero = {
    ...metrics.prefix_cache_hit_rate,
    series: metrics.prefix_cache_hit_rate.series.map((series) => ({
      ...series,
      points: series.points.map(([time]) => [time, 0] as [number, number])
    }))
  };
  assert.ok(
    render({
      cacheFeatures: { prefill: { prefix: false } },
      metrics: { ...metrics, prefix_cache_hit_rate: zero }
    }).specs.some((spec) => spec.key === 'prefill-prefix_cache_hit_rate')
  );
  const failed = {
    ...empty,
    status: 'query_error' as const,
    reason: 'query_failed'
  };
  assert.ok(
    render({
      cacheFeatures: features,
      metrics: { ...metrics, prefix_cache_hit_rate: failed }
    }).specs.some((spec) => spec.key === 'prefill-prefix_cache_hit_rate')
  );
});

test('supported gateway averages remain visible without requests in both views', () => {
  const gateway = {
    ...metric(),
    status: 'no_data' as const,
    reason: 'no_samples',
    measurement_scope: 'service_ingress',
    supported_statistics: ['avg' as const],
    series: [],
    summaries: []
  };
  for (const view of ['aggregate', 'instances'] as const) {
    const { html, specs } = render({
      omitUnavailable: true,
      view,
      metrics: { ...metrics, ingress_ttft: gateway, ingress_e2e: gateway }
    });
    assert.match(html, /Service experience/);
    const service = specs.filter((spec) => spec.key.startsWith('ingress-'));
    assert.equal(service.length, 2);
    assert.ok(
      service.every(
        (spec) => spec.metric?.supported_statistics.join(',') === 'avg'
      )
    );
    assert.ok(service.every((spec) => spec.metric === gateway));
  }
});

test('each role has one three-measure timing figure preserving statistics for the shared selection, without duplicate cards', () => {
  const { specs } = render();
  for (const role of ['prefill', 'decode']) {
    const timing = specs.find((spec) => spec.key === `${role}-request-timing`)!;
    assert.equal(timing.metricKey, 'pd_request_timing');
    assert.equal(timing.metric?.unit, 'seconds');
    assert.equal(timing.measures?.length, 3);
    assert.equal(timing.metric?.series.length, 6);
    assert.ok(
      timing.metric?.series.every(
        (series) =>
          ['avg', 'p99'].includes(series.statistic) &&
          series.dimensions.role === role &&
          series.comparisonMeasure
      )
    );
    for (const key of ['queue', 'e2e', role])
      assert.ok(!specs.some((spec) => spec.key === `${role}-${key}`));
  }
  assert.ok(
    specs.some((spec) => spec.key === 'decode-tpot'),
    'normalized TPOT remains a separate metric'
  );
  assert.ok(
    specs.some((spec) => spec.key === 'decode-itl'),
    'ITL is independently visible'
  );
});

test('generation metrics honor independent vLLM/SGLang capabilities without substituting ITL for TPOT or hiding errors', () => {
  const unsupported = {
    ...metric(),
    status: 'unsupported' as const,
    reason: 'metric_not_provided',
    series: [],
    summaries: [],
    supported_statistics: []
  };
  for (const backend of ['vllm', 'sglang']) {
    for (const absent of ['tpot', 'itl']) {
      const other = absent === 'tpot' ? 'itl' : 'tpot';
      const { specs } = render({
        backend,
        omitUnavailable: true,
        metrics: { ...metrics, [absent]: unsupported }
      });
      assert.ok(!specs.some((spec) => spec.key === `decode-${absent}`));
      const shown = specs.filter((spec) => spec.key === `decode-${other}`);
      assert.equal(shown.length, 1);
      assert.equal(shown[0].metricKey, other);
      assert.ok(
        shown[0].metric!.series.every(
          (line) => line.dimensions.role === 'decode'
        )
      );
    }
    const { specs } = render({
      backend,
      omitUnavailable: true,
      metrics: {
        ...metrics,
        tpot: { ...unsupported, status: 'query_error', reason: 'query_failed' }
      }
    });
    assert.equal(
      specs.find((spec) => spec.key === 'decode-tpot')?.metric?.status,
      'query_error'
    );
    assert.ok(specs.some((spec) => spec.key === 'decode-itl'));
  }
});

test('SGLang native unsupported processing phases are omitted without substituting a zero or input throughput', () => {
  const unsupported = {
    ...metric(),
    status: 'unsupported' as const,
    reason: 'metric_not_provided',
    supported_statistics: [],
    series: [],
    summaries: []
  };
  const { specs } = render({
    backend: 'sglang',
    omitUnavailable: true,
    metrics: { ...metrics, prefill: unsupported, decode: unsupported }
  });
  for (const role of ['prefill', 'decode']) {
    const figure = specs.find((spec) => spec.key === `${role}-request-timing`)!;
    assert.equal(figure.metric?.series.length, 4);
    assert.ok(
      !figure.metric?.series.some((series) =>
        series.name.startsWith(
          role === 'prefill' ? 'Prefill stage' : 'Decode generation'
        )
      )
    );
  }
});
