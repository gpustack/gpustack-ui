import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ModelMetric, Statistic } from '../../config/types';
import {
  pdIngressMetric,
  pdMetricValue,
  pdObservationGroups,
  pdPrefillPrimaryKey,
  pdRoleMetric,
  pdUnsupportedMetric,
  pdUsesBootstrap
} from '../pd-metrics';

const metric = (kind: ModelMetric['kind'] = 'histogram'): ModelMetric => ({
  kind,
  unit: 'seconds',
  measurement_scope: 'engine_local',
  status: 'available',
  reason: null,
  supported_statistics: ['avg', 'p50', 'p95', 'p99'],
  series: (['prefill', 'decode'] as const).flatMap((role, index) =>
    (['avg', 'p99'] as Statistic[]).map((statistic) => ({
      name: `${statistic} ${role}`,
      statistic,
      dimensions: { role, model_instance_id: index + 1 },
      points: [[100, 0.01 + index]]
    }))
  ),
  summaries: [
    { statistic: 'p99', value: 0.1, dimensions: { role: 'prefill' } },
    { statistic: 'p99', value: 0.3, dimensions: { role: 'decode' } }
  ]
});

test('role boundaries select P explicitly and do not inherit D observations', () => {
  const original = metric();
  const p = pdRoleMetric(original, 'prefill')!;
  const d = pdRoleMetric(original, 'decode')!;
  assert.equal(p.series.length, 2);
  assert.equal(p.summaries[0].value, 0.1);
  assert.equal(d.summaries[0].value, 0.3);
  assert.ok(p.series.every((series) => series.dimensions.role === 'prefill'));
  assert.equal(original.series.length, 4, 'selection never mutates API data');
  assert.equal(pdRoleMetric(original, 'router')!.status, 'no_data');
  assert.equal(pdRoleMetric(original, 'router')!.reason, 'no_samples');
});

test('role selection preserves every instance statistic for the global multi-selection without recomputing quantiles', () => {
  const original = metric();
  const p = pdRoleMetric(original, 'prefill')!;
  assert.equal(p.series.length, 2);
  assert.deepEqual(
    p.series.map((line) => line.statistic),
    ['avg', 'p99']
  );
  assert.equal(p.series[0], original.series[0]);
  assert.equal(pdMetricValue(p, 'p99'), 0.1);
  assert.equal(
    pdMetricValue(original, 'p99'),
    null,
    'two role quantiles cannot become one value'
  );
  assert.equal(pdMetricValue(original, 'sum'), null);
  assert.equal(pdMetricValue(original, 'max'), null);
});

test('an Avg-only role preserves its actual average and incompatible-bucket diagnostic', () => {
  const original = metric();
  original.reason = 'incompatible_histogram_buckets';
  original.supported_statistics = ['avg'];
  original.series = original.series.filter((line) => line.statistic === 'avg');
  original.summaries = [
    { statistic: 'avg', dimensions: { role: 'decode' }, value: 1 }
  ];
  const selected = pdRoleMetric(original, 'decode')!;
  assert.equal(selected.series.length, 1);
  assert.equal(selected.series[0].statistic, 'avg');
  assert.equal(selected.reason, 'incompatible_histogram_buckets');
  assert.equal(pdRoleMetric(original, 'router')!.reason, 'no_samples');
});

test('sum and maximum only combine finite gauge/rate summaries and preserve real zero', () => {
  const original = metric('gauge');
  original.summaries[1].dimensions.role = 'prefill';
  original.summaries[0].value = 0;
  original.summaries[1].value = 10;
  assert.equal(pdMetricValue(original, 'sum'), 10);
  assert.equal(pdMetricValue(original, 'max'), 10);
  assert.equal(
    pdMetricValue(
      { ...original, summaries: original.summaries.slice(0, 1) },
      'sum'
    ),
    0
  );
  original.summaries[0].value = null;
  assert.equal(pdMetricValue(original, 'sum'), null);
  assert.equal(pdMetricValue(original, 'max'), null);
  original.status = 'query_error';
  assert.equal(pdMetricValue(original, 'p99'), null);
});

test('pool sums cannot combine P/D request counts or add KV percentages', () => {
  const queues = metric('gauge');
  assert.equal(pdMetricValue(queues, 'sum'), null);
  const kv = pdRoleMetric(queues, 'prefill')!;
  kv.unit = 'percent';
  assert.equal(pdMetricValue(kv, 'sum'), null);
});

test('role coverage retains a partial warning without inventing per-role inventory counts', () => {
  const original = metric();
  original.coverage = {
    expected_instances: 4,
    observed_instances: 3,
    partial: true
  };
  const p = pdRoleMetric(original, 'prefill')!;
  assert.equal(p.coverage, undefined);
  assert.equal(p.reason, 'partial_source_observations');
  original.reason = 'incompatible_histogram_buckets';
  assert.equal(
    pdRoleMetric(original, 'decode')!.reason,
    'incompatible_histogram_buckets'
  );
});

test('service TTFT cannot silently fall back to an engine-local metric', () => {
  const local = metric();
  assert.equal(pdIngressMetric(local).status, 'unsupported');
  assert.equal(pdIngressMetric(local).series.length, 0);
  assert.equal(pdIngressMetric().reason, 'metric_not_provided');
  const ingress = { ...local, measurement_scope: 'service_ingress' };
  assert.equal(pdIngressMetric(ingress), ingress);
});

test('capability fallback is explicit and does not replace transient Prefill query errors', () => {
  const p = metric();
  assert.equal(pdPrefillPrimaryKey({ prefill: p }, 'vLLM'), 'prefill');
  assert.equal(pdPrefillPrimaryKey({ prefill: p }, 'SGLang'), 'input_tokens');
  assert.equal(
    pdPrefillPrimaryKey({ prefill: { ...p, status: 'unsupported' } }),
    'input_tokens'
  );
  assert.equal(
    pdPrefillPrimaryKey({ prefill: { ...p, status: 'query_error' } }),
    'prefill'
  );
  assert.equal(
    pdUsesBootstrap({
      pd_kv_transfer: { ...p, measurement_scope: 'bootstrap_handshake' }
    }),
    true
  );
  assert.equal(pdUsesBootstrap({ pd_kv_transfer: p }, 'vllm'), false);
});

test('pool visibility includes the two role throughputs while local details only describe cache and timing', () => {
  for (const backend of ['vllm', 'sglang']) {
    const groups = pdObservationGroups({}, backend);
    assert.ok(!('router' in groups));
    assert.ok(groups.pools.includes('router_requests'));
    assert.ok(groups.pools.includes('router_health'));
    for (const key of ['input_tokens', 'output_tokens']) {
      assert.equal(groups.pools.filter((item) => item === key).length, 1);
      assert.ok(!groups.roleDetails.includes(key));
    }
    for (const key of ['prefix_cache_hit_rate', 'external_cache_hit_rate'])
      assert.ok(groups.roleDetails.includes(key));
    for (const key of ['queue', 'e2e', 'decode']) {
      assert.ok(groups.pools.includes(key));
      assert.ok(!groups.roleDetails.includes(key));
    }
  }
});

test('unavailable observations contain no invented zero or distribution', () => {
  const unavailable = pdUnsupportedMetric(
    'bytes_per_second',
    'connector_reported_transfer_speed'
  );
  assert.equal(unavailable.status, 'unsupported');
  assert.deepEqual(unavailable.series, []);
  assert.deepEqual(unavailable.summaries, []);
  assert.equal(pdMetricValue(unavailable, 'p99'), null);
});

test('ingress source guards preserve errors and restrictions instead of reporting an unsupported capability', () => {
  for (const status of ['query_error', 'restricted'] as const) {
    const response = pdIngressMetric({
      ...metric(),
      status,
      reason: status === 'query_error' ? 'query_failed' : 'resource_not_visible'
    });
    assert.equal(response.status, status);
    assert.deepEqual(response.series, []);
    assert.deepEqual(response.summaries, []);
  }
});
