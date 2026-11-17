import {
  normalizeLatencyStatistics,
  type LatencyStatistic
} from '@/pages/llmodels/detail/utils/latency-statistics';
import type { StagePoint } from '../components/summary/metrics';
import {
  monitoredLoadPoints,
  type PointView
} from '../components/summary/point-navigation';
import type {
  BenchmarkMonitoring,
  BenchmarkMonitoringData,
  BenchmarkMonitoringQuery
} from '../config/monitoring-types';
import {
  exactRange,
  hasUnavailableRunIdentity,
  phaseForPoint
} from './monitoring';

export interface BenchmarkInspection {
  pointId: number | null;
  phaseId: string | null;
  pointView: PointView;
  zoom: boolean;
  view: 'aggregate' | 'instances';
  latencyStatistics: LatencyStatistic[];
  cursor: number | null;
}

const defaults = (): BenchmarkInspection => ({
  pointId: null,
  phaseId: null,
  pointView: 'load',
  zoom: false,
  view: 'aggregate',
  latencyStatistics: ['p99'],
  cursor: null
});
const one = (params: URLSearchParams, key: string) =>
  params.getAll(key).length === 1 ? params.get(key) : null;

export const readBenchmarkInspection = (
  params: URLSearchParams,
  benchmarkId: number,
  points: StagePoint[]
): BenchmarkInspection => {
  const result = defaults();
  if (one(params, 'id') !== String(benchmarkId)) return result;
  const point = one(params, 'point');
  const pointId = point && /^[1-9]\d*$/.test(point) ? Number(point) : NaN;
  if (
    Number.isSafeInteger(pointId) &&
    points.some((item) => item.id === pointId)
  ) {
    result.pointId = pointId;
    const phase = one(params, 'phase');
    result.phaseId = phase && phase.length <= 200 ? phase : null;
  }
  result.pointView = one(params, 'order') === 'process' ? 'process' : 'load';
  result.view = one(params, 'view') === 'instances' ? 'instances' : 'aggregate';
  result.latencyStatistics = normalizeLatencyStatistics(
    one(params, 'statistics')?.split(',')
  );
  result.zoom = one(params, 'zoom') === 'point' && result.phaseId !== null;
  const cursor = one(params, 'cursor');
  if (result.phaseId && cursor && /^\d+(?:\.\d+)?$/.test(cursor)) {
    const value = Number(cursor);
    if (Number.isFinite(value) && value >= 0) result.cursor = value;
  }
  return result;
};

export const writeBenchmarkInspection = (
  params: URLSearchParams,
  state: BenchmarkInspection
) => {
  const next = new URLSearchParams(params);
  const values = {
    point: state.pointId == null ? null : String(state.pointId),
    phase: state.pointId == null ? null : state.phaseId,
    order: state.pointView === 'process' ? 'process' : null,
    zoom: state.zoom && state.phaseId ? 'point' : null,
    view: state.view === 'instances' ? 'instances' : null,
    statistics:
      normalizeLatencyStatistics(state.latencyStatistics).join(',') === 'p99'
        ? null
        : normalizeLatencyStatistics(state.latencyStatistics).join(','),
    cursor: state.cursor == null || !state.phaseId ? null : String(state.cursor)
  };
  for (const [key, value] of Object.entries(values)) {
    next.delete(key);
    if (value !== null) next.set(key, value);
  }
  return next;
};

// URL phase IDs are scoped to the current result and the current benchmark.
// Never resolve an unknown phase by load or by a neighbouring phase's timing.
export const resolveBenchmarkInspection = (
  state: BenchmarkInspection,
  benchmarkId: number,
  points: StagePoint[],
  context: BenchmarkMonitoring | null
) => {
  const selected = points.find((point) => point.id === state.pointId);
  const phase =
    context?.benchmark_id === benchmarkId && !hasUnavailableRunIdentity(context)
      ? phaseForPoint(selected, context.stages)
      : undefined;
  const valid =
    !!phase &&
    phase.id === state.phaseId &&
    phase.status === 'available' &&
    !!exactRange(phase);
  return {
    ...state,
    phaseId: valid ? phase.id : null,
    zoom: state.zoom && valid,
    cursor: valid ? state.cursor : null
  };
};

export const benchmarkInspectionQuery = (
  state: BenchmarkInspection,
  context: BenchmarkMonitoring,
  previous: BenchmarkMonitoringQuery = {}
): BenchmarkMonitoringQuery => {
  if (!state.zoom || !state.phaseId) {
    if (context.observation_storage?.source === 'archive') {
      const phase = previous.phase_id
        ? context.stages.find((stage) => stage.id === previous.phase_id)
        : undefined;
      const window = previous.phase_id
        ? phase?.status === 'available' && exactRange(phase)
        : context.run_window;
      if (
        (previous.phase_id && !window) ||
        ((previous.start != null || previous.end != null) &&
          (!window ||
            previous.start !== window.start ||
            previous.end !== window.end))
      )
        return { view: state.view };
    }
    return { ...previous, view: state.view };
  }
  const range = exactRange(
    context.stages.find((phase) => phase.id === state.phaseId)
  );
  if (!range) return { view: state.view };
  if (
    context.observation_storage?.source === 'archive' &&
    context.query_capabilities?.phase_replay
  )
    return { view: state.view, phase_id: state.phaseId };
  const maximum = context.capabilities.max_query_seconds;
  return maximum > 0 &&
    (range.end - range.start > maximum ||
      (context.run_window &&
        context.run_window.end - context.run_window.start > maximum))
    ? {
        view: state.view,
        start: range.start,
        end: Math.min(range.end, range.start + maximum)
      }
    : { view: state.view, phase_id: state.phaseId };
};

export const benchmarkInspectionRun = (params: URLSearchParams) => {
  const run = one(params, 'run_id');
  return run &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(run)
    ? run
    : undefined;
};

export const benchmarkInspectionCursor = (
  state: BenchmarkInspection,
  points: StagePoint[],
  selected: StagePoint | null,
  data: BenchmarkMonitoringData
) => {
  const time = state.cursor;
  if (time == null || !data.context || !state.phaseId) return null;
  const range = state.zoom
    ? exactRange(
        data.context.stages.find((phase) => phase.id === state.phaseId)
      )
    : data.window || data.context.run_window;
  if (!range || time < range.start || time >= range.end) return null;
  if (data.window && (time < data.window.start || time >= data.window.end))
    return null;
  if (
    state.pointView === 'load' &&
    !state.zoom &&
    selected?.raw.rate != null &&
    !monitoredLoadPoints(points, selected, data.context.stages).some(
      ({ phase }) => time >= phase.start! && time < phase.end!
    )
  )
    return null;
  const runtime = state.view === 'instances' ? data.instances : data.runtime;
  const metrics = { ...runtime?.metrics, ...data.resources?.metrics };
  // A restored cursor must be an actual sample, never a nearest-sample guess.
  return Object.values(metrics).some((metric) =>
    metric.series.some((series) =>
      [...series.points, ...(series.lower_bounds || [])].some(
        ([timestamp, value]) =>
          timestamp === time &&
          typeof value === 'number' &&
          Number.isFinite(value)
      )
    )
  )
    ? time
    : null;
};

export const browserInspectionParams = () =>
  new URLSearchParams(
    typeof window === 'undefined'
      ? ''
      : window.location.hash.includes('?')
        ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
        : window.location.search
  );
