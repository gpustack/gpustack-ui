import get from 'lodash/get';

export type StageStatistic =
  | 'mean'
  | 'min'
  | 'max'
  | 'p25'
  | 'p50'
  | 'p75'
  | 'p90'
  | 'p95'
  | 'p99';

const LATENCY_SOURCES = {
  ttft: ['time_to_first_token', 'time_to_first_token_ms'],
  tpot: ['inter_token_latency', 'inter_token_latency_ms'],
  itl: ['itl_per_chunk', 'inter_token_latency_per_chunk_ms'],
  latency: ['request_latency', 'request_latency']
} as const;

export type StageLatencyMetric = keyof typeof LATENCY_SOURCES;

const RATE_SOURCES = {
  requests: ['requests_per_second_mean', 'requests_per_second'],
  concurrency: ['request_concurrency_mean', 'request_concurrency'],
  total: ['tokens_per_second_mean', 'tokens_per_second'],
  input: ['input_tokens_per_second_mean', 'prompt_tokens_per_second'],
  output: ['output_tokens_per_second_mean', 'output_tokens_per_second']
} as const;

export type StageRateMetric = keyof typeof RATE_SOURCES;

/** Accept recorded zero; absent, invalid and non-finite statistics stay unknown. */
export const recordedNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;

const rawSuccessfulDistribution = (data: any, field: string) => {
  const benchmark = data?.raw_metrics?.benchmarks?.[0] ?? data?.raw_metrics;
  return get(benchmark, ['metrics', field, 'successful']);
};

/** Read only the selected benchmark, whether supplied directly or wrapped. */
export const rawStageStatistic = (
  data: any,
  field: string,
  statistic: StageStatistic
): number | null => {
  const distribution = rawSuccessfulDistribution(data, field);
  if (distribution?.count === 0) {
    return null;
  }
  const path: string[] = [];
  if (statistic.startsWith('p')) path.push('percentiles');
  path.push(statistic);
  return recordedNumber(get(distribution, path));
};

export const stageScalar = (
  data: any,
  flatField: string,
  rawField: string,
  statistic: 'mean' | 'min' | 'max'
): number | null =>
  recordedNumber(data?.[flatField]) ??
  rawStageStatistic(data, rawField, statistic);

/** Preserve decode-only TPOT and its fallback for non-incremental responses. */
export const stageLatencyValue = (
  data: any,
  metric: StageLatencyMetric,
  statistic: StageStatistic
): number | null => {
  const [prefix, field] = LATENCY_SOURCES[metric];
  const flat = (name: string, rawField: string) => {
    if (rawSuccessfulDistribution(data, rawField)?.count === 0) return null;
    return statistic === 'mean' ||
      statistic === 'p95' ||
      statistic === 'p99' ||
      statistic === 'max'
      ? recordedNumber(data?.[`${name}_${statistic}`])
      : null;
  };
  const values = [
    flat(prefix, field),
    rawStageStatistic(data, field, statistic)
  ];
  if (metric === 'tpot') {
    values.push(
      flat('time_per_output_token', 'time_per_output_token_ms'),
      rawStageStatistic(data, 'time_per_output_token_ms', statistic)
    );
  }
  return (
    values.find((value) => value != null && (metric !== 'tpot' || value > 0)) ??
    null
  );
};

/** Read recorded rate statistics without inventing unsupported flat fields. */
export const stageRateValue = (
  data: any,
  metric: StageRateMetric,
  statistic: 'mean' | 'min' | 'max'
): number | null => {
  const [meanField, rawField] = RATE_SOURCES[metric];
  const flatField =
    statistic === 'mean'
      ? meanField
      : metric === 'concurrency' && statistic === 'max'
        ? 'request_concurrency_max'
        : null;
  return flatField == null
    ? rawStageStatistic(data, rawField, statistic)
    : stageScalar(data, flatField, rawField, statistic);
};

/** Token statistics are measurements, never the configured dataset lengths. */
export const stageTokenValue = (
  data: any,
  metric: 'input' | 'output',
  statistic: StageStatistic
): number | null =>
  rawStageStatistic(
    data,
    metric === 'input' ? 'prompt_token_count' : 'output_token_count',
    statistic
  );
