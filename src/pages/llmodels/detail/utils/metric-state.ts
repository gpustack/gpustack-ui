import type { MetricView, ModelMetric } from '../config/types';
import { finite, hasMetricSamples } from './metrics';

// Only a declared capability absence can be removed from the chart layout.
// Missing responses, errors, permissions and observed zeros remain visible.
export const canOmitMetric = (metric?: MetricView) =>
  !!metric &&
  ['unsupported', 'not_applicable'].includes(metric.status) &&
  !['query_failed', 'resource_not_visible', 'restricted'].includes(
    metric.reason || ''
  ) &&
  !hasMetricSamples(metric) &&
  !metric.summaries.some((summary) => finite(summary.value) != null) &&
  !(metric.componentWarnings || []).some(
    (warning) =>
      !['unsupported', 'not_applicable'].includes(warning.status) ||
      ['query_failed', 'resource_not_visible', 'restricted'].includes(
        warning.reason || ''
      )
  );

export const canOmitMetricGroup = (
  keys: readonly string[],
  metrics: Record<string, ModelMetric>
) => keys.length > 0 && keys.every((key) => canOmitMetric(metrics[key]));

// A supported metric without observations needs its heading and a short reason,
// not a full chart-sized illustration. Errors and permissions stay explicit.
export const compactMetricEmpty = (metric?: MetricView) =>
  !!metric &&
  [
    'available',
    'no_data',
    'no_observations',
    'unsupported',
    'not_applicable'
  ].includes(metric.status) &&
  !['query_failed', 'resource_not_visible', 'restricted'].includes(
    metric.reason || ''
  ) &&
  !hasMetricSamples(metric);

const reasonKeys = new Set([
  'gateway_bypassed',
  'prometheus_unavailable',
  'query_failed',
  'no_samples',
  'zero_observations',
  'insufficient_phase_rate_window',
  'role_not_applicable',
  'metric_not_provided',
  'statistic_not_supported',
  'source_identity_unresolved',
  'device_identity_unresolved',
  'resource_not_visible',
  'legacy_history_unavailable',
  'partial_metric_data',
  'incompatible_histogram_buckets',
  'histogram_quantile_out_of_range',
  'histogram_first_bucket_unresolved',
  'histogram_bounds_unavailable',
  'partial_source_observations'
]);

export const metricStateMessageId = (
  metric?: {
    status?: string;
    reason?: string | null;
    measurement_scope?: string;
  },
  availableFallback = 'no_data'
) => {
  if (
    metric?.measurement_scope === 'service_ingress' &&
    ['no_data', 'no_observations'].includes(metric.status || '') &&
    ['no_samples', 'zero_observations'].includes(metric.reason || '')
  )
    return 'modelMonitoring.state.no_gateway_samples';
  const key =
    metric?.reason && reasonKeys.has(metric.reason)
      ? metric.reason
      : (metric?.status === 'available' ? availableFallback : metric?.status) ||
        'no_data';
  return `modelMonitoring.state.${key}`;
};
