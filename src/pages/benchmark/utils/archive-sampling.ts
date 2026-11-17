import type {
  BenchmarkMonitoring,
  BenchmarkMonitoringData,
  BenchmarkObservationMetadata
} from '../config/monitoring-types';

// Explain only the loaded, pinned observation; do not infer missing values.
export function archiveSamplingDetails(
  context: BenchmarkMonitoring,
  data?: Pick<
    BenchmarkMonitoringData,
    'runtime' | 'instances' | 'resources' | 'window'
  >
) {
  const pin = context.observation_storage;
  const matches = (
    response?:
      | (BenchmarkObservationMetadata & {
          start: number | null;
          end: number | null;
        })
      | null
  ) => {
    const saved = response?.observation_storage;
    return (
      saved?.source === 'archive' &&
      saved.run_id === pin?.run_id &&
      saved.content_version === pin?.content_version &&
      !!data?.window &&
      response?.start === data.window.start &&
      response?.end === data.window.end
    );
  };
  const runtime = [data?.runtime, data?.instances].find((value) =>
    matches(value || null)
  );
  const responses = [runtime, data?.resources].filter(
    (value) =>
      matches(value || null) &&
      (!runtime || (value?.phase_id ?? null) === (runtime.phase_id ?? null))
  );
  let coverage: { observed: number; expected: number; percent: number } | null =
    null;
  for (const response of responses) {
    for (const [key, samples] of Object.entries(
      response?.sample_statistics || {}
    )) {
      if (
        ['unsupported', 'not_applicable'].includes(
          response?.metrics[key]?.status || ''
        )
      )
        continue;
      for (const sample of samples) {
        const observed = sample.observed_samples;
        const expected = sample.expected_samples;
        if (
          !Number.isFinite(observed) ||
          !Number.isFinite(expected) ||
          observed < 0 ||
          expected <= 0 ||
          observed >= expected
        )
          continue;
        const percent = (observed / expected) * 100;
        if (!coverage || percent < coverage.percent)
          coverage = { observed, expected, percent };
      }
    }
  }
  const window = runtime?.rate_window_seconds;
  const rolling = Object.values(runtime?.metrics || {}).some(
    (metric) =>
      metric.kind !== 'gauge' &&
      !['unsupported', 'not_applicable'].includes(metric.status)
  );
  const phases = (context.stages || []).filter(
    (phase) =>
      (!runtime?.phase_id || phase.id === runtime.phase_id) &&
      phase.start != null &&
      phase.end != null &&
      phase.end > phase.start
  );
  const shortPhases =
    rolling && Number.isFinite(window) && window! > 0
      ? phases.filter((phase) => phase.end! - phase.start! <= window!).length
      : 0;
  return {
    coverage,
    shortPhases,
    phaseCount: phases.length,
    rateWindow: window
  };
}
