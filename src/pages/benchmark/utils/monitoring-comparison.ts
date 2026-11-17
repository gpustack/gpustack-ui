import type {
  MetricSeries,
  ModelMetric
} from '@/pages/llmodels/detail/config/types';
import { seriesIdentity } from '@/pages/llmodels/detail/utils/metrics';
import type {
  BenchmarkMonitoring,
  BenchmarkResourceMetrics,
  BenchmarkRuntimeMetrics,
  BenchmarkTimeRange
} from '../config/monitoring-types';
import { exactRange } from './monitoring';

export type ComparisonPhaseIds = readonly [string, string];

export const monitoringComparison = (
  context: BenchmarkMonitoring,
  phaseIds?: ComparisonPhaseIds
) => {
  if (!phaseIds || context.observation_storage?.source === 'archive') return;
  const phases = phaseIds.flatMap((id) => {
    const range = exactRange(context.stages.find((phase) => phase.id === id));
    return range ? [range] : [];
  });
  if (phases.length !== phaseIds.length) return;
  phases.sort((a, b) => a.start - b.start);
  const [first, second] = phases;
  const window = { start: first.start, end: Math.max(first.end, second.end) };
  const limit = context.capabilities.max_query_seconds;
  const maximum = limit > 0 ? limit : Infinity;
  const run = context.run_window;
  if (!run || window.start < run.start || window.end > run.end) return;
  if (window.end - window.start <= maximum) return { window, ranges: [window] };

  // Use measured run ranges here. Phase-specific rolling metrics may discard
  // the entire lookback window, which can be longer than a comparison stage.
  const ranges = phases.flatMap((phase) => {
    const span = phase.end - phase.start;
    // Balanced chunks avoid a tiny, invalid tail at the end of a long stage.
    const count = Math.ceil(span / maximum);
    return Array.from({ length: count }, (_, index) => ({
      start: phase.start + (span * index) / count,
      end:
        index === count - 1
          ? phase.end
          : phase.start + (span * (index + 1)) / count
    }));
  });
  return { window, ranges };
};

const combineSeries = (metrics: ModelMetric[], gaps: number[]) => {
  const series = new Map<
    string,
    {
      line: MetricSeries;
      points: Map<number, number | null>;
      lowerBounds: Map<number, number>;
    }
  >();
  for (const metric of metrics) {
    for (const line of metric.series) {
      const key = seriesIdentity(line);
      const merged = series.get(key) || {
        line,
        points: new Map<number, number | null>(),
        lowerBounds: new Map<number, number>()
      };
      for (const [at, value] of line.points) {
        if (value != null || !merged.points.has(at))
          merged.points.set(at, value);
      }
      for (const [at, value] of line.lower_bounds || []) {
        if (Number.isFinite(value)) merged.lowerBounds.set(at, value);
      }
      series.set(key, merged);
    }
  }
  return [...series.values()].map(({ line, points, lowerBounds }) => {
    const times = [...points.keys()].sort((a, b) => a - b);
    for (const gap of gaps) {
      if (gap > times[0] && gap < times[times.length - 1] && !points.has(gap))
        points.set(gap, null);
    }
    return {
      ...line,
      points: [...points].sort(([a], [b]) => a - b),
      lower_bounds: [...lowerBounds].sort(([a], [b]) => a - b)
    };
  });
};

const sharedSamplingValue = (values: (number | undefined)[]) =>
  values.every((value) => value === values[0]) ? values[0] : undefined;

export const combineBenchmarkComparison = <
  T extends BenchmarkRuntimeMetrics | BenchmarkResourceMetrics
>(
  responses: T[],
  window: BenchmarkTimeRange,
  ranges: BenchmarkTimeRange[]
): T => {
  const gaps: number[] = [];
  let end = window.start;
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    if (range.start > end) gaps.push(end);
    end = Math.max(end, range.end);
  }
  const metricKeys = new Set(
    responses.flatMap(({ metrics }) => Object.keys(metrics))
  );
  const metrics = Object.fromEntries(
    [...metricKeys].map((key) => {
      const entries = responses.flatMap((response) => {
        const metric = response.metrics[key];
        return metric ? [metric] : [];
      });
      const restricted = entries.find(({ status }) => status === 'restricted');
      const metric =
        restricted ||
        entries.find(({ status }) => status === 'query_error') ||
        entries.find(({ status }) => status === 'available') ||
        entries[0];
      const partial =
        metric.status === 'available' &&
        (entries.length < responses.length ||
          entries.some(
            (entry) => entry.status !== 'available' || entry.coverage?.partial
          ));
      return [
        key,
        {
          ...metric,
          reason: partial ? 'partial_metric_data' : metric.reason,
          series: restricted ? [] : combineSeries(entries, gaps),
          summaries: [],
          coverage: undefined
        }
      ];
    })
  );
  const base = responses.reduce((current, response) =>
    response.available ? response : current
  );
  return {
    ...base,
    ...window,
    step: sharedSamplingValue(responses.map(({ step }) => step)),
    ...('rate_window_seconds' in base
      ? {
          rate_window_seconds: sharedSamplingValue(
            responses.map((response) =>
              'rate_window_seconds' in response
                ? response.rate_window_seconds
                : undefined
            )
          )
        }
      : {}),
    phase_id: null,
    metrics,
    sample_statistics: undefined
  };
};
