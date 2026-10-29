const SLO_TARGET_FIELDS = [
  'slo_avg_ttft_ms',
  'slo_p95_ttft_ms',
  'slo_p99_ttft_ms',
  'slo_avg_tpot_ms',
  'slo_p95_tpot_ms',
  'slo_p99_tpot_ms',
  'slo_avg_latency_ms',
  'slo_p95_latency_ms',
  'slo_p99_latency_ms'
] as const;

type PrimaryResultRecord = Partial<
  Record<(typeof SLO_TARGET_FIELDS)[number], number | null>
> & {
  recommended_rate?: number | null;
  slo_met_rate?: number | null;
  validity?: { primary_point?: { rate: number } | null };
};

export const hasSloTargets = (
  record: PrimaryResultRecord | null | undefined
): boolean =>
  SLO_TARGET_FIELDS.some((field) => typeof record?.[field] === 'number');

/** Resolve the stored primary load without deriving a new result from measurements. */
export const getPrimaryResultRate = (
  record: PrimaryResultRecord | null | undefined
): number | null | undefined => {
  const primary = record?.validity?.primary_point;
  if (primary !== undefined) return primary?.rate ?? null;
  // SLO capacity is independent of a throughput-capped operating recommendation.
  if (hasSloTargets(record) && record?.slo_met_rate !== undefined) {
    return record.slo_met_rate;
  }
  return record?.recommended_rate;
};
