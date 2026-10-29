import { VALIDITY_MESSAGE_KEY } from '../config';
import type { FormData, ThroughputDeclineEvidence } from '../config/types';

type Validity = FormData['validity'];
type Warning = { code: string; params?: Record<string, unknown> };

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const record = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value);

/** Validate recorded facts without inferring a policy or recalculating drops. */
const declineEvidence = (
  value: unknown
): ThroughputDeclineEvidence | undefined => {
  if (!record(value)) return undefined;
  const {
    threshold_percent: threshold,
    consecutive_points: count,
    peak_rate: peakRate,
    peak_total_tps: peakTps,
    points
  } = value;
  if (
    !finite(threshold) ||
    threshold <= 0 ||
    threshold > 100 ||
    !finite(count) ||
    !Number.isInteger(count) ||
    count < 1 ||
    !finite(peakRate) ||
    peakRate <= 0 ||
    !finite(peakTps) ||
    peakTps <= 0 ||
    !Array.isArray(points) ||
    points.length !== count
  )
    return undefined;
  if (
    !points.every(
      (point, index) =>
        record(point) &&
        finite(point.rate) &&
        point.rate > 0 &&
        finite(point.total_tps) &&
        point.total_tps >= 0 &&
        point.total_tps <= peakTps &&
        finite(point.drop_percent) &&
        point.drop_percent >= threshold &&
        point.drop_percent <= 100 &&
        (index === 0 || point.rate > points[index - 1].rate)
    )
  )
    return undefined;
  return value as unknown as ThroughputDeclineEvidence;
};

/** Shared by the run alert and list coverage tooltip, including factless reports. */
export const getValidityWarningPresentation = (
  warning: Warning,
  validity: Validity
) => {
  if (warning.code === 'throughput_decline') {
    const evidence = declineEvidence(validity?.throughput_decline);
    if (
      evidence &&
      warning.params?.points === evidence.consecutive_points &&
      warning.params?.threshold === evidence.threshold_percent
    ) {
      return {
        messageId: VALIDITY_MESSAGE_KEY.throughput_decline,
        params: {
          points: evidence.consecutive_points,
          threshold: evidence.threshold_percent
        },
        evidence
      };
    }
    return {
      messageId: 'benchmark.detail.validity.throughputDeclineGeneric',
      params: {},
      evidence: undefined
    };
  }
  return {
    messageId: VALIDITY_MESSAGE_KEY[warning.code] || warning.code,
    params: warning.params || {},
    evidence: undefined
  };
};
