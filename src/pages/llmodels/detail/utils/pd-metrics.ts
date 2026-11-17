import type { ModelMetric, Statistic } from '../config/types';
import { finite } from './metrics';
import {
  pdCacheHasObservations,
  type PDCacheFeatures
} from './pd-cache-features';

export type PDRole = 'prefill' | 'decode' | 'router';

// A role is an observation boundary. Never borrow another role's samples when
// the selected engine has no data, and never average already-computed quantiles.
export const pdRoleMetric = (
  metric: ModelMetric | undefined,
  role: PDRole
): ModelMetric | undefined => {
  if (!metric) return undefined;
  const matches = (item: {
    statistic: Statistic;
    dimensions: { role?: string };
  }) => item.dimensions.role === role;
  const series = metric.series.filter(matches);
  const summaries = metric.summaries.filter(matches);
  const absent =
    !series.length && !summaries.length && metric.status === 'available';
  const roleReported =
    metric.series.some((item) => item.dimensions.role === role) ||
    metric.summaries.some((item) => item.dimensions.role === role);
  return {
    ...metric,
    series,
    summaries,
    // Whole-response coverage cannot describe one role's inventory.
    coverage: undefined,
    status: absent ? 'no_data' : metric.status,
    reason: absent
      ? (roleReported && metric.reason) || 'no_samples'
      : metric.reason ||
        (metric.coverage?.partial ? 'partial_source_observations' : null)
  };
};

export const pdMetricValue = (
  metric: ModelMetric | undefined,
  statistic: Statistic | 'sum' | 'max' = 'p99'
): number | null => {
  if (
    !metric ||
    !['available', 'stale'].includes(metric.status) ||
    !metric.summaries.length
  )
    return null;
  if (statistic === 'sum' || statistic === 'max') {
    // Pool gauges / rates can be combined; request latency quantiles cannot.
    if (metric.kind === 'histogram') return null;
    if (
      statistic === 'sum' &&
      (metric.unit === 'percent' ||
        new Set(metric.summaries.map((summary) => summary.dimensions.role))
          .size > 1)
    )
      return null;
    const values = metric.summaries.map((summary) => finite(summary.value));
    if (values.some((value) => value == null)) return null;
    const observed = values as number[];
    return statistic === 'max'
      ? Math.max(...observed)
      : observed.reduce((total, value) => total + value, 0);
  }
  const summaries = metric.summaries.filter(
    (summary) => summary.statistic === statistic
  );
  return summaries.length === 1 ? finite(summaries[0].value) : null;
};

export const pdUnsupportedMetric = (
  unit: string,
  measurementScope: string,
  kind: ModelMetric['kind'] = 'histogram'
): ModelMetric => ({
  kind,
  unit,
  measurement_scope: measurementScope,
  status: 'unsupported',
  reason: 'metric_not_provided',
  supported_statistics: [],
  series: [],
  summaries: []
});

// Engine first-token time is not the service ingress TTFT, including when an
// older API happens to return an engine metric under an unexpected key.
export const pdIngressMetric = (metric?: ModelMetric): ModelMetric => {
  if (metric?.measurement_scope === 'service_ingress') return metric;
  const unavailable = pdUnsupportedMetric('seconds', 'service_ingress');
  return metric && ['query_error', 'restricted'].includes(metric.status)
    ? { ...unavailable, status: metric.status, reason: metric.reason }
    : unavailable;
};

export const pdIngressStatistic = (metric: ModelMetric): 'p99' | 'avg' =>
  metric.supported_statistics.includes('p99') ? 'p99' : 'avg';

export const pdUsesBootstrap = (
  metrics: Record<string, ModelMetric>,
  backend = ''
) =>
  metrics.pd_kv_transfer?.measurement_scope === 'bootstrap_handshake' ||
  backend.toLowerCase().includes('sglang');

export const pdCompletionMetric = (metrics: Record<string, ModelMetric>) =>
  metrics.pd_kv_completion ||
  (metrics.pd_kv_transfer?.measurement_scope === 'kv_transfer_duration'
    ? metrics.pd_kv_transfer
    : undefined);

export const pdPrefillPrimaryKey = (
  metrics: Record<string, ModelMetric>,
  backend = ''
): 'prefill' | 'input_tokens' =>
  backend.toLowerCase().includes('sglang') ||
  metrics.prefill?.status === 'unsupported'
    ? 'input_tokens'
    : 'prefill';

export const pdObservationGroups = (
  metrics: Record<string, ModelMetric>,
  backend = '',
  cacheFeatures?: PDCacheFeatures
) => {
  const cacheVisible = (key: string, feature: 'prefix' | 'external') =>
    pdCacheHasObservations(metrics[key]) ||
    ['query_error', 'restricted'].includes(metrics[key]?.status || '') ||
    (['prefill', 'decode'] as const).some(
      (role) => cacheFeatures?.[role]?.[feature] !== false
    );
  const roleDetails = [
    ...(cacheVisible('prefix_cache_hit_rate', 'prefix')
      ? ['prefix_cache_hit_rate']
      : []),
    ...(cacheVisible('external_cache_hit_rate', 'external')
      ? ['external_cache_hit_rate']
      : [])
  ];
  const lifecycle = [
    'pd_prefill_bootstrap_queue',
    'pd_prefill_inflight_queue',
    'pd_decode_prealloc_queue',
    'pd_decode_transfer_queue'
  ];
  return {
    service: ['ingress_ttft', 'ingress_e2e'],
    pools: [
      'router_requests',
      'router_health',
      'input_tokens',
      'output_tokens',
      'running_requests',
      'waiting_requests',
      'kv_usage',
      'queue',
      'e2e',
      'decode',
      ...(pdPrefillPrimaryKey(metrics, backend) === 'prefill'
        ? ['prefill']
        : []),
      'tpot',
      'itl',
      ...roleDetails
    ],
    roleDetails,
    pd: [
      metrics.pd_kv_completion || !pdCompletionMetric(metrics)
        ? 'pd_kv_completion'
        : 'pd_kv_transfer',
      'pd_kv_throughput',
      'pd_kv_transfer_failures',
      'pd_kv_bootstrap_failures',
      'pd_kv_expired',
      ...(backend.toLowerCase().includes('sglang') ? lifecycle : [])
    ]
  };
};
