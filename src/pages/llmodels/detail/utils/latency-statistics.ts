import type { MetricView } from '../config/types';
import { INTERVAL_STATISTICS } from './metrics';

export type LatencyStatistic = (typeof INTERVAL_STATISTICS)[number];
export const DEFAULT_LATENCY_STATISTICS: LatencyStatistic[] = ['p99'];

export const normalizeLatencyStatistics = (
  value?: readonly string[] | null
): LatencyStatistic[] => {
  const selected = INTERVAL_STATISTICS.filter((statistic) =>
    value?.includes(statistic)
  );
  return selected.length ? selected : [...DEFAULT_LATENCY_STATISTICS];
};

export const isLatencyMetric = (metric?: MetricView) =>
  metric?.kind === 'histogram' &&
  [
    'seconds',
    'seconds_per_token',
    'milliseconds',
    'milliseconds_per_token',
    'ms',
    'ms/token'
  ].includes(metric.unit);

export const selectLatencyStatistics = (
  metric: MetricView | undefined,
  selection: readonly LatencyStatistic[]
) => {
  if (!metric || !isLatencyMetric(metric))
    return {
      metric,
      statistics: [] as LatencyStatistic[],
      fixedAverage: false
    };
  const supported = INTERVAL_STATISTICS.filter(
    (statistic) =>
      metric.supported_statistics.includes(statistic) ||
      metric.series.some((line) => line.statistic === statistic) ||
      metric.summaries.some((summary) => summary.statistic === statistic)
  );
  const fixedAverage = supported.length === 1 && supported[0] === 'avg';
  const statistics = fixedAverage
    ? ['avg' as const]
    : normalizeLatencyStatistics(selection);
  const selected = new Set<string>(statistics);
  const unavailable =
    supported.length > 0 &&
    !supported.some((statistic) => selected.has(statistic)) &&
    ['available', 'stale'].includes(metric.status);
  const diagnostic =
    metric.reason &&
    !['no_samples', 'zero_observations'].includes(metric.reason)
      ? metric.reason
      : null;
  return {
    statistics,
    fixedAverage,
    metric: {
      ...metric,
      series: metric.series.filter((line) => selected.has(line.statistic)),
      summaries: metric.summaries.filter((summary) =>
        selected.has(summary.statistic)
      ),
      supported_statistics: metric.supported_statistics.filter((statistic) =>
        selected.has(statistic)
      ),
      status:
        unavailable && !diagnostic ? ('unsupported' as const) : metric.status,
      reason: unavailable
        ? diagnostic || 'statistic_not_supported'
        : metric.reason
    }
  };
};
