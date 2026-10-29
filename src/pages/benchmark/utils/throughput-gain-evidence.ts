import type { ThroughputGainEvidence } from '../config/types';

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const positive = (value: unknown): value is number =>
  finite(value) && value > 0;
const record = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value);

/** Read recorded convergence facts without reconstructing gains or policy. */
export const recordedThroughputGainEvidence = (
  value: unknown
): ThroughputGainEvidence | undefined => {
  if (!record(value)) return undefined;
  const {
    threshold_percent: threshold,
    window_points: count,
    baseline_rate: baselineRate,
    baseline_total_tps: baselineTps,
    best_rate: bestRate,
    best_total_tps: bestTps,
    gain_percent: gain,
    lower_rate: lower,
    upper_rate: upper,
    points
  } = value;
  if (
    !positive(threshold) ||
    !positive(count) ||
    !Number.isInteger(count) ||
    !positive(baselineRate) ||
    !positive(baselineTps) ||
    !positive(bestRate) ||
    !positive(bestTps) ||
    bestTps < baselineTps ||
    !finite(gain) ||
    gain < 0 ||
    gain >= threshold ||
    !positive(lower) ||
    !positive(upper) ||
    lower >= bestRate ||
    bestRate >= upper ||
    !Array.isArray(points) ||
    points.length !== count
  )
    return undefined;
  let previousBest = baselineTps;
  for (const point of points) {
    if (
      !record(point) ||
      !positive(point.rate) ||
      !positive(point.total_tps) ||
      !positive(point.best_total_tps) ||
      point.best_total_tps < point.total_tps ||
      point.best_total_tps < previousBest ||
      point.best_total_tps > bestTps
    )
      return undefined;
    previousBest = point.best_total_tps;
  }
  if (previousBest !== bestTps) return undefined;
  return value as unknown as ThroughputGainEvidence;
};
