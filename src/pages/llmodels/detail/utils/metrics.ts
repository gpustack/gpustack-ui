import type {
  Dimensions,
  MetricSeries,
  ModelMetric,
  Statistic
} from '../config/types';
export const INTERVAL_STATISTICS = ['avg', 'p50', 'p95', 'p99'] as const;
export const finite = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
export const hasMetricSamples = (metric?: Pick<ModelMetric, 'series'>) =>
  !!metric?.series?.some(
    (item) =>
      item.points.some(([, value]) => finite(value) != null) ||
      item.lower_bounds?.some(
        ([time, value]) => finite(time) != null && finite(value) != null
      )
  );
export const alignedPoints = (
  series: { points: [number, number | null][] }[]
) => {
  const timestamps = [
    ...new Set(
      series.flatMap((item) => item.points.map(([timestamp]) => timestamp))
    )
  ].sort((a, b) => a - b);
  return {
    timestamps,
    values: series.map((item) => {
      const lookup = new Map(item.points);
      return timestamps.map((timestamp) => finite(lookup.get(timestamp)));
    })
  };
};
export const selectRoleMetric = (
  metric: ModelMetric | undefined,
  pd: boolean,
  role: string
): ModelMetric | undefined => {
  if (!metric || !pd) return metric;
  const selected = role === 'all' ? 'decode' : role;
  const series = metric.series.filter(
    (item) => item.dimensions.role === selected
  );
  const summaries = metric.summaries.filter(
    (item) => item.dimensions.role === selected
  );
  const missing =
    !series.length && !summaries.length && metric.status === 'available';
  return {
    ...metric,
    series,
    summaries,
    status: missing ? 'no_data' : metric.status,
    reason: missing ? 'no_samples' : metric.reason
  };
};
export const summaryStatistics = (metric?: ModelMetric) =>
  INTERVAL_STATISTICS.map((statistic) => {
    const matches =
      metric?.summaries.filter((item) => item.statistic === statistic) || [];
    return {
      statistic,
      value: matches.length === 1 ? finite(matches[0].value) : null,
      lowerBound:
        matches.length === 1 && finite(matches[0].value) == null
          ? finite(matches[0].lower_bound)
          : null,
      count: matches.length,
      sampleCount: matches.length === 1 ? matches[0].sample_count : null
    };
  });
export const metricValue = (
  metric: ModelMetric | undefined,
  statistic: Statistic
): number | null => {
  const matches =
    metric?.summaries.filter((item) => item.statistic === statistic) || [];
  return matches.length === 1 ? finite(matches[0].value) : null;
};
export const metricLowerBound = (
  metric: ModelMetric | undefined,
  statistic: Statistic
): number | null => {
  const matches =
    metric?.summaries.filter((item) => item.statistic === statistic) || [];
  return matches.length === 1 && finite(matches[0].value) == null
    ? finite(matches[0].lower_bound)
    : null;
};
export const displayUnit = (unit?: string, metricKey?: string) =>
  unit === 'seconds' && metricKey === 'tpot'
    ? 'ms/token'
    : {
        seconds: 'ms',
        bytes: 'GiB',
        bytes_per_second: 'MiB/s',
        percent: '%',
        watts: 'W',
        celsius: '°C',
        tokens_per_second: 'token/s',
        requests_per_second: 'req/s',
        requests: '',
        state: ''
      }[unit || ''] ||
      unit ||
      '';
const displayNumber = (number: number, unit?: string) =>
  unit === 'seconds'
    ? number * 1000
    : unit === 'bytes'
      ? number / 1024 ** 3
      : unit === 'bytes_per_second'
        ? number / 1024 ** 2
        : number;
export const displayValue = (
  value: number | null | undefined,
  unit?: string,
  locale = 'en-US'
): string => {
  const number = finite(value);
  if (number == null) return '—';
  const scaled = displayNumber(number, unit);
  return scaled.toLocaleString(locale, {
    maximumFractionDigits: unit === 'requests' || unit === 'state' ? 0 : 2
  });
};
export const displayMetricValue = (
  value: number | null | undefined,
  unit?: string,
  metricKey?: string,
  lowerBound?: number | null
) => {
  const observation = displayObservationValue(value, lowerBound, unit);
  if (observation === '—') return observation;
  return [observation, displayUnit(unit, metricKey)].filter(Boolean).join(' ');
};
export const displayObservationValue = (
  value: number | null | undefined,
  lowerBound?: number | null,
  unit?: string
) => {
  if (finite(value) != null) return displayValue(value, unit);
  const bound = finite(lowerBound);
  if (bound == null) return '—';
  const scaled = displayNumber(bound, unit);
  if (!Number.isFinite(scaled)) return '—';
  const precision =
    unit === 'requests' || unit === 'state'
      ? 0
      : scaled !== 0 && Math.abs(scaled) < 1
        ? Math.min(
            20,
            Math.max(2, 1 - Math.floor(Math.log10(Math.abs(scaled))))
          )
        : 2;
  let displayed = Number(scaled.toFixed(precision));
  // Rounding a lower bound upward would claim more than the source proves.
  if (displayed > scaled)
    displayed = Number((displayed - 10 ** -precision).toFixed(precision));
  return `> ${displayed.toLocaleString('en-US', { maximumFractionDigits: precision })}`;
};
export const displayCapacityValue = (
  used: number | null | undefined,
  total: number | null | undefined
) => {
  if (finite(used) == null && finite(total) == null) return '—';
  if (finite(used) != null && finite(total) != null)
    return `${displayValue(used, 'bytes')} / ${displayMetricValue(total, 'bytes')}`;
  return `${displayMetricValue(used, 'bytes')} / ${displayMetricValue(total, 'bytes')}`;
};
export const seriesIdentity = (item: {
  compositionKey?: string;
  name: string;
  statistic: string;
  dimensions: object;
}) => {
  if (item.compositionKey) return item.compositionKey;
  const dimensions = item.dimensions as Record<string, unknown>;
  const identified =
    dimensions.model_instance_id != null ||
    dimensions.device_id != null ||
    dimensions.worker_id != null;
  return JSON.stringify([
    identified ? null : item.name,
    item.statistic,
    Object.entries(dimensions || {})
      .filter(([key]) => !identified || key !== 'model_instance_name')
      .sort()
  ]);
};

const uniqueLabel = (parts: (string | undefined)[]) =>
  parts
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(' · ');

export const metricDimensionsLabel = (dimensions: Dimensions) => {
  const role = dimensions.role;
  const endpoint = dimensions.endpoint_dp_rank;
  const engine = dimensions.dp_rank;
  const separateRanks =
    endpoint != null && engine != null && String(endpoint) !== String(engine);
  return uniqueLabel([
    role
      ? (
          { prefill: 'Prefill', decode: 'Decode', router: 'Router' } as Record<
            string,
            string
          >
        )[role] || role
      : undefined,
    dimensions.model_instance_name ||
      (dimensions.model_instance_id != null
        ? `#${dimensions.model_instance_id}`
        : undefined),
    dimensions.source_name === 'legacy' ? undefined : dimensions.source_name,
    separateRanks ? `Endpoint DP ${endpoint}` : undefined,
    engine != null
      ? `DP ${engine}`
      : endpoint != null
        ? `DP ${endpoint}`
        : undefined
  ]);
};

export const metricSeriesLabel = (
  series: MetricSeries,
  measures: string[] = []
) => {
  const dimensions = metricDimensionsLabel(series.dimensions);
  const measure = measures.find(
    (name) => series.name === name || series.name.startsWith(name + ' · ')
  );
  const fallback =
    series.name === 'legacy' && series.dimensions.source_name === 'legacy'
      ? 'Deployment'
      : series.name;
  const hardware =
    series.dimensions.device_id != null || series.dimensions.worker_id != null;
  const hardwareName =
    measure && series.name.startsWith(measure + ' · ')
      ? series.name.slice(measure.length + 3)
      : fallback;
  return uniqueLabel([
    ['avg', 'p50', 'p95', 'p99'].includes(series.statistic)
      ? series.statistic === 'avg'
        ? 'Avg'
        : series.statistic.toUpperCase()
      : undefined,
    measure,
    dimensions || (hardware ? hardwareName : measure ? undefined : fallback)
  ]);
};
