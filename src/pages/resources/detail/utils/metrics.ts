import type {
  MetricSeries,
  ModelMetric
} from '@/pages/llmodels/detail/config/types';
import { finite } from '@/pages/llmodels/detail/utils/metrics';

export const reportedGPUCount = (
  reported: unknown,
  addressable: number
): number | null =>
  addressable > 0
    ? addressable
    : Array.isArray(reported) && reported.length === 0
      ? 0
      : null;

export const samplingIsStale = (metrics: Record<string, ModelMetric> = {}) => {
  const observed = Object.values(metrics).filter((metric) =>
    ['available', 'stale'].includes(metric.status)
  );
  return (
    observed.length > 0 && observed.every((metric) => metric.status === 'stale')
  );
};

const dimensionsKey = (value: object) =>
  JSON.stringify(Object.entries(value).sort());
export const memoryPercentage = (
  used?: ModelMetric,
  total?: ModelMetric
): ModelMetric | undefined => {
  if (!used || !total) return undefined;
  const ratio = (a: unknown, b: unknown) =>
    typeof a === 'number' &&
    Number.isFinite(a) &&
    typeof b === 'number' &&
    Number.isFinite(b) &&
    b > 0
      ? (100 * a) / b
      : null;
  const series = used.series.map((s) => {
    const match = total.series.filter(
      (t) => dimensionsKey(t.dimensions) === dimensionsKey(s.dimensions)
    );
    const values = new Map(match.length === 1 ? match[0].points : []);
    return {
      ...s,
      points: s.points.map(([time, v]): [number, number | null] => [
        time,
        ratio(v, values.get(time))
      ])
    };
  });
  const summaries = used.summaries.map((s) => {
    const match = total.summaries.filter(
      (t) => dimensionsKey(t.dimensions) === dimensionsKey(s.dimensions)
    );
    return {
      ...s,
      value: ratio(s.value, match.length === 1 ? match[0].value : null)
    };
  });
  const valid = series.some((s) => s.points.some(([, v]) => finite(v) != null));
  const current = summaries.some((s) => finite(s.value) != null);
  return {
    ...used,
    unit: 'percent',
    series,
    summaries,
    status: current
      ? 'available'
      : valid
        ? 'stale'
        : [used, total].find((m) =>
            ['query_error', 'restricted', 'unsupported'].includes(m.status)
          )?.status || 'no_data',
    reason:
      used.reason ||
      total.reason ||
      (current ? null : valid ? 'no_recent_samples' : 'no_samples')
  };
};
export const combineMemory = (
  used: ModelMetric | undefined,
  total: ModelMetric | undefined,
  usedLabel: string,
  totalLabel: string
): ModelMetric | undefined => {
  const source = used || total;
  if (!source) return undefined;
  const rename = (
    metric: ModelMetric | undefined,
    label: string
  ): MetricSeries[] =>
    (metric?.series || []).map((s) => ({
      ...s,
      compositionKey: JSON.stringify([label, s.dimensions, s.statistic]),
      name: `${label} · ${s.name}`
    }));
  return {
    ...source,
    series: [...rename(used, usedLabel), ...rename(total, totalLabel)],
    summaries: [...(used?.summaries || []), ...(total?.summaries || [])],
    reason:
      used?.status === 'available' && total?.status === 'available'
        ? null
        : source.status === 'available'
          ? 'partial_metric_data'
          : source.reason
  };
};
