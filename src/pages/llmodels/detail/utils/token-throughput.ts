import type { MetricSeries, MetricView, ModelMetric } from '../config/types';
import { alignedPoints, finite, selectRoleMetric } from './metrics';

interface TokenTotalOptions {
  metric: MetricView | undefined;
  input: ModelMetric | undefined;
  output: ModelMetric | undefined;
  totalLabel: string;
  pd: boolean;
}

// A derived throughput, not a cumulative token count. Only matching, complete
// observations can be added; an absent replica or time point is never zero.
export const withTokenTotal = ({
  metric,
  input,
  output,
  totalLabel,
  pd
}: TokenTotalOptions): MetricView | undefined => {
  if (!metric) return metric;
  const sides = [
    selectRoleMetric(input, pd, 'prefill'),
    selectRoleMetric(output, pd, 'decode')
  ];
  const observations = sides.map((side) => {
    if (
      !side ||
      side.unit !== 'tokens_per_second' ||
      !['available', 'stale'].includes(side.status) ||
      side.coverage?.partial ||
      [
        'partial_source_observations',
        'partial_metric_data',
        'query_failed'
      ].includes(side.reason || '') ||
      !side.series.length
    )
      return null;
    return side.series.map(
      (series) =>
        new Map(series.points.map(([time, value]) => [time, finite(value)]))
    );
  });
  const sideAt = (side: (typeof observations)[number], time: number) => {
    if (!side) return null;
    let sum = 0;
    for (const points of side) {
      const value = points.get(time);
      if (value == null) return null;
      sum += value;
    }
    return finite(sum);
  };
  const total: MetricSeries = {
    name: `${totalLabel} · Deployment`,
    statistic: 'rate',
    dimensions: {},
    points: alignedPoints(metric.series).timestamps.map((time) => {
      const inputRate = sideAt(observations[0], time);
      const outputRate = sideAt(observations[1], time);
      return [
        time,
        inputRate == null || outputRate == null
          ? null
          : finite(inputRate + outputRate)
      ];
    })
  };
  return { ...metric, series: [...metric.series, total] };
};
