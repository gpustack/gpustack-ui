import dayjs from 'dayjs';
import { FALLBACK_MONITORING_CAPABILITIES } from '../config';
import type { MonitoringCapabilities, MonitoringScope } from '../config/types';

export const monitoringCapabilities = (
  value?: Partial<MonitoringCapabilities> | null
): MonitoringCapabilities => {
  const fallback = FALLBACK_MONITORING_CAPABILITIES;
  const positive = (number: unknown): number | null =>
    typeof number === 'number' && Number.isFinite(number) && number > 0
      ? number
      : null;
  return {
    ...fallback,
    ...value,
    min_query_seconds: Math.max(
      fallback.min_query_seconds,
      positive(value?.min_query_seconds) || fallback.min_query_seconds
    ),
    max_query_seconds: Math.min(
      fallback.max_query_seconds,
      positive(value?.max_query_seconds) || fallback.max_query_seconds
    ),
    retention_seconds: positive(value?.retention_seconds),
    retention_size_based: value?.retention_size_based === true,
    retention_known: value?.retention_known === true,
    supports_custom_range: value?.supports_custom_range === true
  };
};

export const durationLabel = (seconds: number) =>
  seconds % 86400 === 0
    ? `${seconds / 86400}d`
    : seconds % 3600 === 0
      ? `${seconds / 3600}h`
      : seconds % 60 === 0
        ? `${seconds / 60}m`
        : `${seconds}s`;

export type TimeRangeError =
  | 'missing'
  | 'invalid'
  | 'future'
  | 'tooShort'
  | 'tooLong';
export const validateTimeRange = (
  start: number | undefined,
  end: number | undefined,
  limits: Pick<
    MonitoringCapabilities,
    'min_query_seconds' | 'max_query_seconds'
  >,
  now = Math.floor(Date.now() / 1000)
): TimeRangeError | null => {
  if (start == null || end == null) return 'missing';
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= end
  )
    return 'invalid';
  if (end > now) return 'future';
  if (end - start < limits.min_query_seconds) return 'tooShort';
  if (end - start > limits.max_query_seconds) return 'tooLong';
  return null;
};

export const isFixedTimeRange = (
  scope: Pick<MonitoringScope, 'start' | 'end'>
) => scope.start != null && scope.end != null;

export const scopeTimeParams = (
  scope: Pick<MonitoringScope, 'window' | 'start' | 'end'>
) => {
  if (scope.start == null && scope.end == null) return { window: scope.window };
  if (
    validateTimeRange(scope.start, scope.end, FALLBACK_MONITORING_CAPABILITIES)
  )
    throw new RangeError('Invalid fixed monitoring time range');
  return { start: scope.start!, end: scope.end! };
};

export const scopeTimeLabel = (
  scope: Pick<MonitoringScope, 'window' | 'start' | 'end'>
) =>
  isFixedTimeRange(scope)
    ? `${dayjs(scope.start! * 1000).format('YYYY-MM-DD HH:mm:ss')} → ${dayjs(scope.end! * 1000).format('YYYY-MM-DD HH:mm:ss')}`
    : scope.window;

export const applyMonitoringScopePatch = (
  scope: MonitoringScope,
  patch: Partial<MonitoringScope>
): MonitoringScope => {
  const next = { ...scope, ...patch };
  if ('window' in patch && !('start' in patch) && !('end' in patch)) {
    next.start = undefined;
    next.end = undefined;
  }
  if ('role' in patch) next.instanceIds = [];
  if ('instanceIds' in patch) next.role = 'all';
  if ('role' in patch || 'instanceIds' in patch) next.deviceId = undefined;
  return next;
};
