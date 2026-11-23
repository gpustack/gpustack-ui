import type { BenchmarkResultItem } from '../config/types';
import { recordedNumber } from './stage-detail-metrics';

export const requestTermination = (raw: BenchmarkResultItem['raw_metrics']) =>
  raw?.termination ?? raw?.benchmarks?.[0]?.termination;

/** Keep raw request counts separate from the population used to judge success. */
export const requestAccounting = (
  data?: Partial<BenchmarkResultItem> | null
) => {
  const raw = data?.raw_metrics;
  const benchmark = raw?.benchmarks?.[0] ?? raw;
  const totals = benchmark?.metrics?.request_totals;
  const successful =
    recordedNumber(data?.request_successful) ??
    recordedNumber(totals?.successful);
  const errored =
    recordedNumber(data?.request_errored) ?? recordedNumber(totals?.errored);
  const incomplete =
    recordedNumber(data?.request_incomplete) ??
    recordedNumber(totals?.incomplete);
  const total =
    recordedNumber(data?.request_total) ??
    recordedNumber(totals?.total) ??
    (successful != null && errored != null && incomplete != null
      ? successful + errored + incomplete
      : null);
  const termination = requestTermination(raw);
  const cancelled = termination?.cancelled_at_boundary;
  const available =
    total != null && successful != null && errored != null
      ? total - successful - errored
      : 0;
  const cancelledAtBoundary =
    termination?.reason === 'min_requests' &&
    typeof cancelled === 'number' &&
    Number.isInteger(cancelled) &&
    cancelled >= 0 &&
    incomplete != null &&
    cancelled <= Math.min(incomplete, available)
      ? cancelled
      : 0;
  const evaluatedTotal = total == null ? null : total - cancelledAtBoundary;
  return {
    total,
    successful,
    errored,
    incomplete,
    cancelledAtBoundary,
    evaluatedTotal,
    successRate:
      successful != null && evaluatedTotal != null && evaluatedTotal > 0
        ? successful / evaluatedTotal
        : null,
    unplannedIncomplete:
      incomplete == null ? null : Math.max(0, incomplete - cancelledAtBoundary)
  };
};

/** Both request-count targets finish normally; other constraints may stop early. */
export const isEarlyTermination = (
  termination?: { reason?: unknown } | null
): boolean =>
  typeof termination?.reason === 'string' &&
  termination.reason.length > 0 &&
  termination.reason !== 'max_requests' &&
  termination.reason !== 'min_requests';
