import type { BenchmarkPhase } from '../../config/monitoring-types';
import { chronologicalPoints, phaseForPoint } from '../../utils/monitoring';
import type { StagePoint } from './metrics';

export type PointView = 'load' | 'process';
export type ComparisonBasis = 'adjacent' | 'previous' | 'custom';
export type SearchPhase = NonNullable<BenchmarkPhase['search_phase']>;
export type LoadMode = 'auto_tune' | 'stages' | 'single';
export const sameWorkload = (a: StagePoint, b: StagePoint) =>
  (a.raw.input_tokens ?? 0) === (b.raw.input_tokens ?? 0);

export const loadOrderedPoints = (points: StagePoint[]) =>
  [...points].sort(
    (a, b) =>
      (a.raw.input_tokens ?? 0) - (b.raw.input_tokens ?? 0) ||
      a.load - b.load ||
      a.raw.sequence - b.raw.sequence ||
      a.id - b.id
  );

export const measurementNumber = (
  point: StagePoint,
  phases: BenchmarkPhase[]
) => {
  if (point.raw.rate == null) return null;
  const number = phaseForPoint(point, phases)?.measurement_number;
  return number != null && Number.isInteger(number) && number > 0
    ? number
    : Number.isInteger(point.raw.sequence) && point.raw.sequence >= 0
      ? point.raw.sequence + 1
      : null;
};

export const comparisonPoint = (
  points: StagePoint[],
  point: StagePoint | null | undefined,
  phases: BenchmarkPhase[],
  basis: Exclude<ComparisonBasis, 'custom'>
) => {
  if (!point || point.raw.rate == null) return undefined;
  const cohort = chronologicalPoints(
    points.filter((p) => sameWorkload(p, point)),
    phases
  );
  if (basis === 'previous')
    return cohort[cohort.findIndex((p) => p.id === point.id) - 1];
  return loadOrderedPoints(cohort.filter((p) => p.load < point.load)).at(-1);
};

export const searchGroups = (
  points: StagePoint[],
  phases: BenchmarkPhase[],
  mode: LoadMode
) => {
  const groups: {
    key: string;
    phase: SearchPhase;
    inputTokens: number | null;
    points: StagePoint[];
  }[] = [];
  const maxima = new Map<number, number>();
  for (const point of chronologicalPoints(points, phases)) {
    const cohort = point.raw.input_tokens ?? 0;
    const phase =
      phaseForPoint(point, phases)?.search_phase ||
      (mode === 'auto_tune'
        ? point.load > (maxima.get(cohort) ?? -Infinity)
          ? 'expand'
          : 'refine'
        : mode === 'stages'
          ? 'manual'
          : 'single');
    maxima.set(cohort, Math.max(point.load, maxima.get(cohort) ?? -Infinity));
    const last = groups.at(-1);
    if (last?.phase === phase && (last.inputTokens ?? 0) === cohort)
      last.points.push(point);
    else
      groups.push({
        key: `${cohort}:${phase}:${point.id}`,
        phase,
        inputTokens: point.raw.input_tokens ?? null,
        points: [point]
      });
  }
  return groups;
};

export const pointFindings = (
  points: StagePoint[],
  selected?: StagePoint | null
) => {
  const cohort = loadOrderedPoints(
    points.filter((p) => !selected || sameWorkload(p, selected))
  );
  const capacity = cohort.filter((p) => p.sloPass === true).at(-1);
  const breach =
    capacity &&
    cohort.find((p) => p.load > capacity.load && p.sloPass === false);
  const peak =
    cohort.find((p) => p.isPeak) ||
    cohort
      .filter((p) => p.tps != null && Number.isFinite(p.tps))
      .reduce<
        StagePoint | undefined
      >((best, p) => (!best || p.tps! > best.tps! ? p : best), undefined);
  return { capacity, breach, peak };
};

// A load comparison stays within one input-length workload. Untimed phases cannot
// be positioned using result order or a guessed duration.
export const monitoredLoadPoints = (
  points: StagePoint[],
  selected: StagePoint | null | undefined,
  phases: BenchmarkPhase[]
) => {
  if (!selected || selected.raw.rate == null) return [];
  return loadOrderedPoints(
    points.filter((point) => sameWorkload(point, selected))
  ).flatMap((point) => {
    const phase = phaseForPoint(point, phases);
    return phase?.status === 'available' &&
      typeof phase.start === 'number' &&
      typeof phase.end === 'number' &&
      Number.isFinite(phase.start) &&
      Number.isFinite(phase.end) &&
      phase.start < phase.end
      ? [{ point, phase, number: measurementNumber(point, phases) }]
      : [];
  });
};
