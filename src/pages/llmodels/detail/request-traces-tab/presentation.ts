import dayjs from 'dayjs';
import type { TraceRecord, TraceRequestMetrics, TraceSpan } from './requests';

export type TraceMessage = (
  key: string,
  values?: Record<string, string | number>
) => string;

export const formatTraceId = (id: string) =>
  id.replace(/^0+(?=[0-9a-f]+$)/i, '');

export const traceRecordKey = (
  row: Pick<
    TraceRecord,
    'trace_id' | 'entry_span_id' | 'request_id' | 'started_at_ms'
  >
) =>
  `${row.trace_id}:${row.entry_span_id ?? row.request_id ?? row.started_at_ms}`;

export function traceDurationLabel(
  row: Pick<TraceRecord, 'observation_source' | 'engine_phase'>,
  t: TraceMessage
) {
  if (row.observation_source === 'router') return t('routerDuration');
  if (row.observation_source === 'engine') {
    const phase = row.engine_phase;
    return phase
      ? t('enginePhaseDuration', {
          phase: phase === 'prefill' ? 'Prefill' : 'Decode'
        })
      : t('engineDuration');
  }
  return t('duration');
}

export const formatTraceValue = (
  value: number | null | undefined,
  unit = '',
  maximumFractionDigits = 2
) =>
  value == null
    ? '—'
    : `${value.toLocaleString(undefined, { maximumFractionDigits })}${unit ? ' ' + unit : ''}`;

export const formatTraceTokens = (metrics?: TraceRequestMetrics | null) =>
  metrics?.input_tokens == null && metrics?.output_tokens == null
    ? '—'
    : `${formatTraceValue(metrics.input_tokens)} / ${formatTraceValue(metrics.output_tokens)}`;

export const formatTraceDate = (timestamp: number) =>
  dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');

export function spanTimelineLabel(
  span: Pick<
    TraceSpan,
    'name' | 'service' | 'reported_service' | 'start_offset_ms' | 'duration_ms'
  >
) {
  return {
    title: span.name || '—',
    subtitle: [
      (span.reported_service ?? span.service) || '—',
      `+${formatTraceValue(span.start_offset_ms, 'ms')}`,
      formatTraceValue(span.duration_ms, 'ms')
    ].join(' · ')
  };
}

export function spanTimelineRows<T extends Pick<TraceSpan, 'id' | 'parent_id'>>(
  spans: T[]
) {
  const ids = new Set(spans.map(({ id }) => id));
  const children = new Map<string | null, T[]>();
  for (const span of spans) {
    const parent =
      span.parent_id && ids.has(span.parent_id) ? span.parent_id : null;
    const siblings = children.get(parent);
    if (siblings) {
      siblings.push(span);
    } else {
      children.set(parent, [span]);
    }
  }

  const ordered: { span: T; depth: number }[] = [];
  const visited = new Set<string>();
  const visit = (span: T, depth: number) => {
    if (visited.has(span.id)) return;
    visited.add(span.id);
    ordered.push({ span, depth });
    for (const child of children.get(span.id) ?? []) visit(child, depth + 1);
  };
  for (const span of children.get(null) ?? []) visit(span, 0);
  for (const span of spans) visit(span, 0);
  return ordered;
}

type SpanTimelineRow<T> = { span: T; depth: number };
type PhaseSpan = Pick<TraceSpan, 'id' | 'phase' | 'role' | 'service'>;

function spanPhase(span: PhaseSpan): TraceSpan['phase'] {
  if (span.phase) return span.phase;
  if (span.role !== 'engine') return null;
  const match = /^(?:vllm|sglang)\.(prefill|decode)$/.exec(span.service);
  return match ? (match[1] as 'prefill' | 'decode') : null;
}

export function defaultCollapsedSpanIds(rows: SpanTimelineRow<PhaseSpan>[]) {
  const path: string[] = [];
  const phasePaths = [];
  for (const { span, depth } of rows) {
    path.length = depth;
    path.push(span.id);
    const phase = spanPhase(span);
    if (phase) phasePaths.push({ phase, path: [...path] });
  }

  const prefill = phasePaths.find((entry) => entry.phase === 'prefill');
  const decode = phasePaths.find((entry) => entry.phase === 'decode');
  if (!prefill || !decode) return new Set<string>();

  const fork = prefill.path.findIndex((id, depth) =>
    phasePaths.some((entry) => entry.path[depth] !== id)
  );
  if (fork < 1) return new Set<string>();

  const branches = new Map<string, 'prefill' | 'decode'>();
  for (const { phase, path } of phasePaths) {
    const branch = path[fork];
    const assigned = branches.get(branch);
    if (!branch || (assigned && assigned !== phase)) return new Set<string>();
    branches.set(branch, phase);
  }
  return new Set(branches.keys());
}

export function visibleSpanTimelineRows<T extends Pick<TraceSpan, 'id'>>(
  rows: SpanTimelineRow<T>[],
  collapsed: ReadonlySet<string>
) {
  let collapsedDepth = Infinity;
  return rows.flatMap((row, index) => {
    if (row.depth > collapsedDepth) return [];
    collapsedDepth = collapsed.has(row.span.id) ? row.depth : Infinity;
    const hasChildren = (rows[index + 1]?.depth ?? 0) > row.depth;
    return [{ ...row, hasChildren }];
  });
}

type SpanTiming = Pick<TraceSpan, 'start_offset_ms' | 'duration_ms'>;

export function spanTimelineDuration(spans: SpanTiming[]) {
  return Math.max(
    1,
    ...spans.map((span) => span.start_offset_ms + span.duration_ms)
  );
}
