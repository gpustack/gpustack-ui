import type {
  Dimensions,
  ModelMetric
} from '@/pages/llmodels/detail/config/types';
import type { StagePoint } from '../components/summary/metrics';
import type {
  BenchmarkMonitoring,
  BenchmarkMonitoringQuery,
  BenchmarkObservationMetadata,
  BenchmarkPhase,
  BenchmarkResourceMetrics,
  BenchmarkRuntimeMetrics,
  BenchmarkTimeRange
} from '../config/monitoring-types';

export const observationQuery = (
  context?: BenchmarkObservationMetadata | null
): Pick<BenchmarkMonitoringQuery, 'run_id' | 'content_version'> => {
  const storage = context?.observation_storage;
  return storage
    ? {
        run_id: storage.run_id,
        ...(storage.source === 'archive' && storage.content_version != null
          ? { content_version: storage.content_version }
          : {})
      }
    : {};
};

export const savedObservation = (
  context?: BenchmarkObservationMetadata | null
) => context?.observation_storage?.source === 'archive';

export const archiveCapturePending = (
  context?: BenchmarkObservationMetadata | null
) =>
  ['pending', 'capturing', 'finalizing'].includes(
    context?.observation_storage?.archive_state || ''
  );

export class ArchiveContentChanged extends Error {
  constructor() {
    super('The saved monitoring content changed during this request');
  }
}

export const archiveContentChanged = (error: unknown) => {
  if (error instanceof ArchiveContentChanged) return true;
  const response = (error as any)?.response;
  const details = response?.data?.details ?? (error as any)?.data?.details;
  return (
    response?.status === 409 &&
    details?.code === 'benchmark_archive_content_changed'
  );
};

export const checkObservationStorage = <T extends BenchmarkObservationMetadata>(
  response: T,
  context?: BenchmarkObservationMetadata | null
): T => {
  const expected = context?.observation_storage;
  const actual = response.observation_storage;
  if (!expected) return response;
  if (!actual || expected.run_id !== actual.run_id)
    throw new Error('The monitoring response does not match the selected run');
  if (
    expected.source !== actual.source ||
    (expected.source === 'archive' &&
      expected.content_version !== actual.content_version)
  )
    throw new ArchiveContentChanged();
  return response;
};

export const hasUnavailableRunIdentity = (
  context: Pick<BenchmarkMonitoring, 'available' | 'reason'> | null | undefined
) =>
  context?.available === false &&
  [
    'historical_association_unavailable',
    'historical_association_changed',
    'model_not_visible',
    'model_instance_not_visible'
  ].includes(context.reason || '');

export const monitoringPopulationKey = (context?: BenchmarkMonitoring | null) =>
  JSON.stringify(
    context
      ? {
          benchmark_id: context.benchmark_id,
          model_id: context.model_id,
          available: context.available,
          reason: context.reason,
          resource_status: context.resource_status,
          resource_reason: context.resource_reason,
          observation_storage: context.observation_storage && {
            source: context.observation_storage.source,
            run_id: context.observation_storage.run_id,
            content_version: context.observation_storage.content_version
          },
          instances: [...(context.instances || [])].sort((a, b) => a.id - b.id),
          workers: [...(context.workers || [])].sort((a, b) => a.id - b.id),
          devices: [...(context.devices || [])].sort((a, b) =>
            a.id.localeCompare(b.id)
          ),
          events: context.events || []
        }
      : null
  );

export const phaseForPoint = (
  point: StagePoint | null | undefined,
  phases: BenchmarkPhase[]
) =>
  point
    ? phases.find(
        (phase) =>
          phase.sequence === point.raw.sequence &&
          (phase.input_tokens ?? 0) === (point.raw.input_tokens ?? 0)
      )
    : undefined;

export const exactRange = (
  phase?: Pick<BenchmarkPhase, 'start' | 'end'> | null
): BenchmarkTimeRange | null =>
  typeof phase?.start === 'number' &&
  Number.isFinite(phase.start) &&
  typeof phase.end === 'number' &&
  Number.isFinite(phase.end) &&
  phase.end > phase.start
    ? { start: phase.start, end: phase.end }
    : null;

export const chronologicalPoints = (
  points: StagePoint[],
  phases: BenchmarkPhase[]
) =>
  [...points].sort((a, b) => {
    const left = phaseForPoint(a, phases);
    const right = phaseForPoint(b, phases);
    const leftTime = left?.traffic_start ?? left?.start;
    const rightTime = right?.traffic_start ?? right?.start;
    if (typeof leftTime === 'number' && typeof rightTime === 'number')
      return leftTime - rightTime || a.raw.sequence - b.raw.sequence;
    return (
      a.raw.sequence - b.raw.sequence ||
      (a.raw.input_tokens ?? 0) - (b.raw.input_tokens ?? 0)
    );
  });

// End is exclusive: the next phase's first sample is never this phase's end value.
export const phaseSamples = (
  metric: ModelMetric | undefined,
  range: BenchmarkTimeRange | null,
  dimension?: {
    key: 'role' | 'model_instance_id' | 'worker_id' | 'device_id';
    values: (number | string)[];
  }
) =>
  !range || !metric || metric.status === 'restricted'
    ? []
    : metric.series.flatMap((series) =>
        dimension &&
        !dimension.values.includes(series.dimensions[dimension.key] as never)
          ? []
          : series.points
              .filter(
                ([time, value]) =>
                  time >= range.start &&
                  time < range.end &&
                  typeof value === 'number' &&
                  Number.isFinite(value)
              )
              .map(([time, value]) => ({
                time,
                value: value as number,
                dimensions: series.dimensions
              }))
      );

export const sampledSummary = (
  metric: ModelMetric | undefined,
  range: BenchmarkTimeRange | null,
  dimension?: Parameters<typeof phaseSamples>[2]
) => {
  const samples = phaseSamples(metric, range, dimension);
  if (!samples.length)
    return {
      avg: null,
      peak: null,
      end: null,
      count: 0,
      peakTime: null,
      peakDimensions: null,
      highShare: null
    };
  const peak = samples.reduce((a, b) => (b.value > a.value ? b : a));
  const last = samples.reduce((a, b) => (b.time > a.time ? b : a));
  return {
    avg: samples.reduce((sum, item) => sum + item.value, 0) / samples.length,
    peak: peak.value,
    end: last.value,
    count: samples.length,
    peakTime: peak.time,
    peakDimensions: peak.dimensions,
    highShare:
      (100 * samples.filter((item) => item.value >= 90).length) / samples.length
  };
};

export const safeDelta = (
  current: number | null | undefined,
  baseline: number | null | undefined,
  percentagePoints = false
): number | null => {
  if (
    typeof current !== 'number' ||
    !Number.isFinite(current) ||
    typeof baseline !== 'number' ||
    !Number.isFinite(baseline)
  )
    return null;
  const delta = percentagePoints
    ? current - baseline
    : baseline === 0
      ? NaN
      : 100 * ((current - baseline) / Math.abs(baseline));
  return Number.isFinite(delta) ? delta : null;
};

// A maximum can move between entities. Its numeric change is not a change in
// one entity's performance unless both observations identify the same source.
export const peakSourceComparison = (
  current: { peak: number | null; peakDimensions: Dimensions | null },
  baseline: { peak: number | null; peakDimensions: Dimensions | null }
): 'same' | 'changed' | 'unavailable' | 'missing' => {
  if (current.peak == null || baseline.peak == null) return 'missing';
  const identity = (dimensions: Dimensions | null) => {
    if (
      !dimensions ||
      ![
        dimensions.role,
        dimensions.model_instance_id,
        dimensions.model_instance_name,
        dimensions.device_id,
        dimensions.worker_id
      ].some((value) => value != null && value !== '')
    )
      return null;
    // Display names may change without changing a source's stable ID.
    const { model_instance_name, ...stable } = dimensions;
    return JSON.stringify(
      Object.entries({
        ...stable,
        ...(dimensions.model_instance_id == null && model_instance_name
          ? { model_instance_name }
          : {})
      })
        .filter(([, value]) => value != null && value !== '')
        .sort(([left], [right]) => left.localeCompare(right))
    );
  };
  const left = identity(current.peakDimensions);
  const right = identity(baseline.peakDimensions);
  return !left || !right ? 'unavailable' : left === right ? 'same' : 'changed';
};

export const phaseObservationSummary = (
  response: BenchmarkRuntimeMetrics | BenchmarkResourceMetrics | null,
  key: string,
  range: BenchmarkTimeRange | null,
  dimension?: Parameters<typeof phaseSamples>[2]
) => {
  const fallback = sampledSummary(response?.metrics[key], range, dimension);
  const summaries = response?.sample_statistics?.[key];
  if (
    !summaries ||
    !range ||
    response?.metrics[key]?.status === 'restricted' ||
    (typeof response?.start === 'number' && response.start !== range.start) ||
    (typeof response?.end === 'number' && response.end !== range.end)
  )
    return { ...fallback, expected: null, coverage: null };
  const selected = summaries.filter(
    (entry) =>
      !dimension ||
      dimension.values.includes(entry.dimensions[dimension.key] as never)
  );
  const finite = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);
  const observed = selected.reduce(
    (sum, entry) => sum + entry.observed_samples,
    0
  );
  const expected = selected.reduce(
    (sum, entry) => sum + entry.expected_samples,
    0
  );
  const peak = selected
    .filter(
      (entry) =>
        finite(entry.peak) &&
        (entry.peak_at == null ||
          (finite(entry.peak_at) &&
            entry.peak_at >= range.start &&
            entry.peak_at < range.end))
    )
    .sort((a, b) => b.peak! - a.peak!)[0];
  const last = selected
    .filter((entry) => finite(entry.last) && finite(entry.last_at))
    .sort((a, b) => b.last_at! - a.last_at!)[0];
  const averaged = selected.filter(
    (entry) => finite(entry.average) && entry.observed_samples > 0
  );
  const averageCount = averaged.reduce(
    (sum, entry) => sum + entry.observed_samples,
    0
  );
  const thresholded = selected.filter(
    (entry) => entry.threshold === 90 && finite(entry.threshold_fraction)
  );
  const thresholdCount = thresholded.reduce(
    (sum, entry) => sum + entry.observed_samples,
    0
  );
  return {
    avg: averageCount
      ? averaged.reduce(
          (sum, entry) => sum + entry.average! * entry.observed_samples,
          0
        ) / averageCount
      : null,
    peak: peak?.peak ?? null,
    peakTime: peak?.peak_at ?? null,
    peakDimensions: peak?.dimensions ?? null,
    end: last?.last ?? null,
    count: observed,
    expected,
    coverage: expected ? observed / expected : null,
    highShare: thresholdCount
      ? (100 *
          thresholded.reduce(
            (sum, entry) =>
              sum + entry.threshold_fraction! * entry.observed_samples,
            0
          )) /
        thresholdCount
      : null
  };
};
