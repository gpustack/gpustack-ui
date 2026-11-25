import { request } from '@umijs/max';
import type { QUICK_TIME_RANGES } from '../config';

export type TraceWindow = (typeof QUICK_TIME_RANGES)[number][0];
export type TraceTimeRange =
  | { window: TraceWindow }
  | { start: number; end: number };
export type TraceOutcome = 'success' | 'error' | 'cancelled' | 'unknown';
export interface TraceFilters {
  q?: string;
  range: TraceTimeRange;
  outcome?: TraceOutcome;
  instance_id?: number;
}
export interface TraceCapabilities {
  tracing_enabled: boolean;
  trace_query_configured: boolean;
}
export interface TraceRequestMetrics {
  ttft_ms?: number | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
}
export interface TraceEngineMetrics extends TraceRequestMetrics {
  queue_ms?: number | null;
  prefill_ms?: number | null;
  decode_ms?: number | null;
  tpot_ms?: number | null;
}
export interface TraceEngineMetricsByPhase {
  prefill?: TraceEngineMetrics | null;
  decode?: TraceEngineMetrics | null;
}
export interface TraceRecord {
  request_id: string | null;
  trace_id: string;
  entry_span_id?: string | null;
  observation_source?: 'platform' | 'router' | 'engine';
  engine_phase?: 'prefill' | 'decode' | null;
  started_at_ms: number;
  duration_ms: number;
  observed_by: string;
  path: string | null;
  status_code: number | null;
  outcome: TraceOutcome;
  stream: boolean | null;
  instance_id: number | null;
  instance_name?: string | null;
  has_engine: boolean;
  engine: TraceEngineMetrics | null;
  engine_by_phase?: TraceEngineMetricsByPhase | null;
  request_metrics?: TraceRequestMetrics | null;
}
export interface TracePage {
  items: TraceRecord[];
  cursor: string;
  next_cursor: string | null;
}

export interface TraceSpan {
  id: string;
  parent_id: string | null;
  name: string;
  service: string;
  reported_service?: string | null;
  role: 'gateway' | 'proxy' | 'engine' | 'other';
  start_offset_ms: number;
  duration_ms: number;
  status: string;
  engine?: TraceEngineMetrics | null;
  phase?: 'prefill' | 'decode' | null;
}
export interface TraceDetail {
  request: TraceRecord;
  spans: TraceSpan[];
  span_count: number;
}

const tracePath = (modelId: number) => `/models/${modelId}/request-traces`;
const options = (signal: AbortSignal) => ({
  method: 'GET',
  signal,
  skipErrorHandler: true
});

export const getTraceCapabilities = (modelId: number, signal: AbortSignal) =>
  request<TraceCapabilities>(
    `${tracePath(modelId)}/capabilities`,
    options(signal)
  );

export const tracePageSize = 10;

export const getTraceRecords = (
  modelId: number,
  { range, ...filters }: TraceFilters,
  signal: AbortSignal,
  cursor?: string
) =>
  request<TracePage>(tracePath(modelId), {
    ...options(signal),
    params: { ...filters, ...range, page_size: tracePageSize, cursor }
  });

export const getTraceDetail = (
  modelId: number,
  row: TraceRecord,
  signal: AbortSignal
) =>
  request<TraceDetail>(`${tracePath(modelId)}/${row.trace_id}`, {
    ...options(signal),
    params: {
      entry_span_id: row.entry_span_id ?? undefined,
      request_id: row.entry_span_id ? undefined : (row.request_id ?? undefined)
    }
  });
