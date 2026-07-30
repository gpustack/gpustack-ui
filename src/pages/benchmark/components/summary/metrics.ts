import _ from 'lodash';
import { BenchmarkResultItem } from '../../config/types';
import { StageStatusKind, getStageStatus } from './ui';

// ── The report's single data source ────────────────────────────────────────────
// Every number the Summary tab renders (hero bar, operating curve, the nine
// detail charts, the stage table, the stage detail) is derived HERE, once. Two
// call sites computing the same metric two ways is how a p99 ends up reading
// 62.82 in one panel and 71.03 in another.

// A percentile from a stage's raw_metrics (its guidellm benchmark dump, so the
// distributions live under `.metrics`). Always the `.successful` branch.
//
// Returns null — not 0 — when absent: p25 / p75 only exist for points measured
// after the runner schema started keeping them, and a missing quantile must
// render as "no band", never as a band collapsing to zero.
const pct = (
  r: BenchmarkResultItem,
  field: string,
  key: string
): number | null => {
  const v = _.get(r.raw_metrics, [
    'metrics',
    field,
    'successful',
    'percentiles',
    key
  ]);
  return typeof v === 'number' ? v : null;
};

const dist = (
  r: BenchmarkResultItem,
  field: string,
  key: string
): number | null => {
  const v = _.get(r.raw_metrics, ['metrics', field, 'successful', key]);
  return typeof v === 'number' ? v : null;
};

// ── Which field is "TPOT" ─────────────────────────────────────────────────────
// guidellm reports two per-output-token latencies and its names are the reverse
// of the industry's:
//
//   inter_token_latency_ms   = (last_token − first_token) / (output_tokens − 1)
//                              decode only. This IS what vLLM / genai-perf and
//                              the rest of the field call TPOT.
//   time_per_output_token_ms = (last_token − request_start) / output_tokens
//                              includes TTFT, so it bills prefill and queue wait
//                              to the decode loop. It has no standard name.
//
// So the report reads the FIRST one and labels it TPOT. The second is never shown
// on its own: on a 128-token run it sits ~5% above TPOT, but the gap is
// TTFT / (n × TPOT), so at 16 output tokens it is ~40% — a queueing number
// wearing a decode label.
//
// The `sla_*_tpot_ms` thresholds bound this same field — on the server
// (SLA_THRESHOLDS), in the runner's bracketing, and in SLA_CHECKS below. One
// basis everywhere, so a ✓ in the table cannot disagree with the stored
// sla_met_rate.
//
// With one shared exception: the decode-only reading needs two token timestamps,
// so a response that arrives as a single chunk (the whole output at once, common
// at low load) collapses it to 0. Then, and only then, the includes-TTFT value is
// the only per-token number there is, and every layer falls back to it —
// `decodeMs` here, `t.fallback` on the server, `or` in the runner.
const TPOT_FIELD = 'inter_token_latency_ms';
const TPOT_FALLBACK_FIELD = 'time_per_output_token_ms';

/** A per-token latency, or null; 0 means "not incrementally streamed", not 0 ms. */
const positive = (v: number | null | undefined): number | null =>
  typeof v === 'number' && v > 0 ? v : null;

/** Decode-only per-token time for one percentile, falling back as described above. */
const decodeMs = (r: BenchmarkResultItem, key: string): number | null =>
  positive(pct(r, TPOT_FIELD, key)) ??
  positive(pct(r, TPOT_FALLBACK_FIELD, key));

export interface StagePoint {
  raw: BenchmarkResultItem;
  id: number;
  // Load axis value: req/s for a fixed-rate run, streams for a concurrency run.
  load: number;
  // Achieved rate. Charted against `load` to expose the shortfall that marks the
  // system's real ceiling. guidellm's own windowed rate, NOT requests/duration —
  // the latter is diluted by warmup/cooldown and by the tail of a stage draining.
  achievedRate: number | null;
  conc: number | null;
  // Configured concurrency. Exists ONLY on a concurrency-axis run, where it is
  // the knob itself; an open-loop fixed-rate run has no such target and this
  // stays null (the chart hides rather than inventing a line to compare against).
  confConc: number | null;

  ttft: number | null; // ms
  /**
   * TPOT in the industry sense: decode-only, (last_token - first_token) / (n-1).
   *
   * From guidellm's `inter_token_latency_ms`, falling back to
   * `time_per_output_token_ms` only when the response was not streamed
   * incrementally — see the note above `TPOT_FIELD`.
   */
  tpot: number | null; // ms
  latency: number | null; // seconds

  tps: number | null;
  inTps: number | null;
  outTps: number | null;

  // TTFT distribution (ms). p25/p75 = the IQR band; p99 = the tail.
  ttftP25: number | null;
  ttftP50: number | null;
  ttftP75: number | null;
  ttftP99: number | null;
  // End-to-end request latency distribution (seconds).
  latP25: number | null;
  latP50: number | null;
  latP75: number | null;
  latP99: number | null;
  // TPOT distribution (ms).
  tpotP50: number | null;
  tpotP90: number | null;
  tpotP99: number | null;

  total: number;
  ok: number;
  errored: number;
  incomplete: number;
  duration: number | null;
  // Sample size behind the latency percentiles of THIS point. Below ~100, p99
  // degenerates to max and a single outlier would be read as an SLA conclusion,
  // so the tail is flagged rather than silently trusted.
  sampleCount: number;
  lowSample: boolean;

  status: StageStatusKind;
  isBest: boolean;
  isPeak: boolean;
  isOverloaded: boolean;
  /**
   * SLA verdict for this stage. null = the run set no thresholds, which is NOT
   * the same as false ("measured, and it breached") — conflating them would
   * paint an SLA-failure marker over every throughput run.
   */
  slaPass: boolean | null;
}

/**
 * Below this sample count the tail percentiles are not an estimate, they are one or
 * two individual requests.
 *
 * A percentile is only as good as the samples ABOVE it: with n samples, p99 has
 * n/100 above it. n=40 => p99 IS the maximum. n=100 => the second-largest value.
 * ~1000 is where p99 gets ten samples in its tail and starts behaving like an
 * estimate.
 *
 * So this is deliberately NOT the runner's `min_requests` floor (now 100). Setting
 * the two equal is what makes the warning dead code: every stage clears the floor,
 * the flag never fires, and a p99 still decided by one request is presented without
 * comment. The floor removes the degenerate "p99 == max"; this threshold says
 * whether the tail on screen means anything.
 */
export const LOW_SAMPLE_THRESHOLD = 1000;

/** How many samples sit above p99 — what the tail estimate actually rests on. */
export const tailSamples = (count: number): number => Math.floor(count / 100);

// ── SLA verdict ───────────────────────────────────────────────────────────────
// Mirrors the backend's _meets_sla so the table's ✓/✗, the curve's breach region
// and the backend's own sla_met_rate cannot tell three different stories.

/** The nine optional thresholds, each paired with the value it bounds. */
const SLA_CHECKS: Array<{
  field: string;
  get: (p: SlaInputs) => number | null | undefined;
  /** Onto milliseconds: request latency is stored in seconds. */
  scale: number;
}> = [
  { field: 'sla_avg_ttft_ms', get: (p) => p.ttft, scale: 1 },
  {
    field: 'sla_p95_ttft_ms',
    get: (p) => p.raw.time_to_first_token_p95,
    scale: 1
  },
  { field: 'sla_p99_ttft_ms', get: (p) => p.ttftP99, scale: 1 },
  // The tpot thresholds bound the decode-only metric, same as the displayed TPOT
  // and same as the server's SLA_THRESHOLDS. p95 / p99 fall back to the dump
  // because the two flat columns only exist for points measured after the basis
  // moved; without the fallback every stage of an older run would read as a
  // breach ("not measured" fails closed, by design).
  { field: 'sla_avg_tpot_ms', get: (p) => p.tpot, scale: 1 },
  {
    field: 'sla_p95_tpot_ms',
    get: (p) =>
      positive(p.raw.inter_token_latency_p95) ?? decodeMs(p.raw, 'p95'),
    scale: 1
  },
  { field: 'sla_p99_tpot_ms', get: (p) => p.tpotP99, scale: 1 },
  { field: 'sla_avg_latency_ms', get: (p) => p.latency, scale: 1000 },
  {
    field: 'sla_p95_latency_ms',
    get: (p) => p.raw.request_latency_p95,
    scale: 1000
  },
  { field: 'sla_p99_latency_ms', get: (p) => p.latP99, scale: 1000 }
];

/** A stage below this success rate fails the SLA whatever its latencies say. */
export const SLA_SUCCESS_FLOOR = 0.95;

type SlaInputs = Omit<StagePoint, 'slaPass'>;
type SlaTargets = Record<string, unknown> | null | undefined;

const evalSla = (p: SlaInputs, targets: SlaTargets): boolean | null => {
  const active = SLA_CHECKS.filter(
    (c) => typeof targets?.[c.field] === 'number'
  );
  if (!active.length) return null;
  if (p.total <= 0 || p.ok / p.total < SLA_SUCCESS_FLOOR) return false;
  // Every SET threshold must hold (AND). A threshold whose metric was never
  // recorded fails rather than being waived: "we did not measure it" is not
  // evidence that it held.
  return active.every((c) => {
    const v = c.get(p);
    // Non-positive is "not measured" too, not "0 ms, passes". The decode-only
    // TPOT is undefined for single-token outputs and guidellm reports 0.0 for it;
    // the worker's _sla_value draws the same line.
    return v != null && v > 0 && v * c.scale <= (targets![c.field] as number);
  });
};

interface BuildOpts {
  recommendedRate?: number | null;
  peakRate?: number | null;
  // True when the load axis is concurrency (so `load` is the configured
  // concurrency and the configured-vs-actual comparison is meaningful).
  isConcurrency?: boolean;
  // The benchmark record, read for its flat sla_* threshold fields. Absent or
  // threshold-free leaves every point's slaPass at null.
  slaTargets?: SlaTargets;
}

/**
 * Normalize the measured grid into the report's per-stage rows, ordered by load.
 *
 * Points with no rate (the auto-tune saturation probe) are dropped: they are a
 * ceiling measurement, not a stage of the sweep, and plotting them would put a
 * point with no x coordinate on every chart.
 */
export const buildStagePoints = (
  results: BenchmarkResultItem[],
  { recommendedRate, peakRate, isConcurrency, slaTargets }: BuildOpts
): StagePoint[] => {
  const measured = results
    .filter((r) => r.rate != null)
    .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0));
  // Peak throughput across the measured points, needed to tell a declining
  // (overloaded) point from one merely past the knee at ~peak throughput.
  const maxThroughput = measured.reduce(
    (m, r) => Math.max(m, r.tokens_per_second_mean ?? 0),
    0
  );

  return measured.map((r) => {
    const status = getStageStatus(
      r,
      { recommended_rate: recommendedRate, peak_rate: peakRate },
      maxThroughput
    );
    const isBest = status === 'recommended';
    const total = r.request_total ?? 0;
    // Prefer the TTFT distribution's own sample count (per-request, which is
    // what a latency percentile is over); fall back to the request tally for
    // points written before `count` was kept.
    const sampleCount =
      dist(r, 'time_to_first_token_ms', 'count') ?? r.request_successful ?? 0;

    const point: SlaInputs = {
      raw: r,
      id: r.id,
      load: r.rate as number,
      achievedRate: r.requests_per_second_mean,
      conc: r.request_concurrency_mean,
      confConc: isConcurrency ? (r.rate as number) : null,

      ttft: r.time_to_first_token_mean,
      tpot:
        positive(r.inter_token_latency_mean) ??
        positive(r.time_per_output_token_mean),
      latency: r.request_latency_mean,

      tps: r.tokens_per_second_mean,
      inTps: r.input_tokens_per_second_mean,
      outTps: r.output_tokens_per_second_mean,

      ttftP25: pct(r, 'time_to_first_token_ms', 'p25'),
      ttftP50: pct(r, 'time_to_first_token_ms', 'p50'),
      ttftP75: pct(r, 'time_to_first_token_ms', 'p75'),
      // The flat column and the dump agree; read the column so the table, the
      // hero bar and the curve cannot drift apart.
      ttftP99:
        r.time_to_first_token_p99 ?? pct(r, 'time_to_first_token_ms', 'p99'),

      latP25: pct(r, 'request_latency', 'p25'),
      latP50: pct(r, 'request_latency', 'p50'),
      latP75: pct(r, 'request_latency', 'p75'),
      latP99: r.request_latency_p99 ?? pct(r, 'request_latency', 'p99'),

      // All three from the dump: unlike TTFT there is no flat p99 column for the
      // decode-only metric, and inventing one would mean a migration.
      tpotP50: decodeMs(r, 'p50'),
      tpotP90: decodeMs(r, 'p90'),
      tpotP99: decodeMs(r, 'p99'),

      total,
      ok: r.request_successful ?? 0,
      errored: r.request_errored ?? 0,
      incomplete: r.request_incomplete ?? 0,
      duration:
        typeof r.raw_metrics?.duration === 'number'
          ? r.raw_metrics.duration
          : null,
      sampleCount,
      lowSample: sampleCount > 0 && sampleCount < LOW_SAMPLE_THRESHOLD,

      status,
      isBest,
      isPeak: !isBest && peakRate != null && r.rate === peakRate,
      isOverloaded: status === 'overloaded'
    };

    return { ...point, slaPass: evalSla(point, slaTargets) };
  });
};

// The saturation probe rows (rate == null) as StagePoints, so the table, the
// stage-detail drill-down and the run totals treat them like any other stage.
// A probe is NOT a ramp point: it has no load value (charts skip it), is never
// best/peak/overloaded, and is not SLA-judged (no target rate to meet).
export const buildProbePoints = (probes: BenchmarkResultItem[]): StagePoint[] =>
  probes.map((r) => {
    const total = r.request_total ?? 0;
    const sampleCount =
      dist(r, 'time_to_first_token_ms', 'count') ?? r.request_successful ?? 0;
    return {
      raw: r,
      id: r.id,
      load: NaN,
      achievedRate: r.requests_per_second_mean,
      conc: r.request_concurrency_mean,
      confConc: null,
      ttft: r.time_to_first_token_mean,
      tpot:
        positive(r.inter_token_latency_mean) ??
        positive(r.time_per_output_token_mean),
      latency: r.request_latency_mean,
      tps: r.tokens_per_second_mean,
      inTps: r.input_tokens_per_second_mean,
      outTps: r.output_tokens_per_second_mean,
      ttftP25: pct(r, 'time_to_first_token_ms', 'p25'),
      ttftP50: pct(r, 'time_to_first_token_ms', 'p50'),
      ttftP75: pct(r, 'time_to_first_token_ms', 'p75'),
      ttftP99:
        r.time_to_first_token_p99 ?? pct(r, 'time_to_first_token_ms', 'p99'),
      latP25: pct(r, 'request_latency', 'p25'),
      latP50: pct(r, 'request_latency', 'p50'),
      latP75: pct(r, 'request_latency', 'p75'),
      latP99: r.request_latency_p99 ?? pct(r, 'request_latency', 'p99'),
      tpotP50: decodeMs(r, 'p50'),
      tpotP90: decodeMs(r, 'p90'),
      tpotP99: decodeMs(r, 'p99'),
      total,
      ok: r.request_successful ?? 0,
      errored: r.request_errored ?? 0,
      incomplete: r.request_incomplete ?? 0,
      duration:
        typeof r.raw_metrics?.duration === 'number'
          ? r.raw_metrics.duration
          : null,
      sampleCount,
      lowSample: sampleCount > 0 && sampleCount < LOW_SAMPLE_THRESHOLD,
      status: 'ok',
      isBest: false,
      isPeak: false,
      isOverloaded: false,
      slaPass: null
    };
  });

/**
 * Index of the stage from which the SLA is never met again, or -1.
 *
 * NOT simply the first failing stage: a lone dip that recovers at a higher load
 * is noise, and shading from it would paint a red region over stages the table
 * marks ✓. The onset is the start of the failing SUFFIX, which is also the point
 * the backend's sla_met_rate is measured against.
 */
export const slaBreachOnset = (points: StagePoint[]): number => {
  let onset = -1;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].slaPass === false) onset = i;
    else if (points[i].slaPass === true) break;
  }
  return onset;
};

/**
 * Whole-run totals for the section headers.
 *
 * Two populations, because the three numbers answer three different questions:
 *
 * * `points` — the measured stages. "N stages", the request total and the success
 *   rate are all about the load the user asked to be run, and the saturation probe
 *   is not part of it (it has no load value; its requests are an instrument
 *   reading). Counting it there made the page disagree with the worker's own
 *   aggregate — 11 stages / 7,340 requests for a 10-stage / 7,290 run — and, now
 *   that the probe is time-boxed, a probe cut off mid-flight (290/802) would drag a
 *   healthy run's success rate to 36%.
 * * `aux` — the probe and any legacy bound passes. They DO count toward elapsed:
 *   that is wall clock the user waited through, and the probe runs FIRST, so
 *   leaving it out silently shortens the reported run by the probe's duration.
 *   ("耗时对不上" was a real complaint; excluding the probe from the span is what
 *   caused it.)
 */
export const stageTotals = (points: StagePoint[], aux: StagePoint[] = []) => {
  let requests = 0;
  let ok = 0;
  let minStart = Infinity;
  let maxEnd = -Infinity;
  let durSum = 0;
  for (const p of points) {
    requests += p.total;
    ok += p.ok;
  }
  // The time span covers everything that actually ran, measured stage or not.
  for (const p of [...points, ...aux]) {
    const b: any = p.raw.raw_metrics || {};
    if (typeof b.start_time === 'number')
      minStart = Math.min(minStart, b.start_time);
    if (typeof b.end_time === 'number') maxEnd = Math.max(maxEnd, b.end_time);
    if (p.duration != null) durSum += p.duration;
  }
  // Wall clock from the first point's start to the last point's end, so the gaps
  // between sequential stages count too; the sum of durations is the fallback.
  const seconds =
    isFinite(minStart) && isFinite(maxEnd) && maxEnd > minStart
      ? maxEnd - minStart
      : durSum;
  return {
    stages: points.length,
    requests,
    ok,
    seconds,
    successRate: requests > 0 ? ok / requests : null,
    // Only worth a chart when something actually failed (a flat 100% line is a
    // whole panel spent saying nothing happened).
    hasFailures: points.some((p) => p.errored > 0 || p.incomplete > 0)
  };
};

// ── Formatters ────────────────────────────────────────────────────────────────
// Axis ticks and tooltips share these. Rounding happens AFTER the unit
// conversion: rounding in ms and dividing by 1000 in the formatter is what
// produces "6.108020000000001s".

const trim = (v: number, big = 10): number =>
  Math.abs(v) >= big ? Math.round(v) : Math.round(v * 100) / 100;

/** Milliseconds, promoted to seconds past 1s. */
export const fmtMs = (v: number): string =>
  v >= 1000 ? `${trim(v / 1000)}s` : `${trim(v, 100)}ms`;

/** Seconds. */
export const fmtSec = (v: number): string => `${trim(v)}s`;

/** Token rates, thousands-compacted for axis ticks. */
export const fmtTps = (v: number): string =>
  v >= 1000 ? `${trim(v / 1000, 100)}k` : String(Math.round(v));

/** Full token rate for tooltips, where the exact value is the point. */
export const fmtTpsFull = (v: number): string =>
  `${Math.round(v).toLocaleString()} tok/s`;

export const fmtRate = (v: number): string => `${trim(v, 100)} req/s`;

export const fmtInt = (v: number): string => String(Math.round(v));

/**
 * A percentage that lives near 100. One decimal, because the deviations worth
 * reading on a closed-loop run are 1–3% and rounding to whole percent would
 * collapse "held 97.7% of the target" and "held it exactly" into one number.
 */
export const fmtPct = (v: number): string => `${Math.round(v * 10) / 10}%`;

/** Human "1h 3m 48s" (drops empty leading units). */
export const fmtDuration = (sec: number): string => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [h ? `${h}h` : '', h || m ? `${m}m` : '', `${r}s`]
    .filter(Boolean)
    .join(' ');
};

/**
 * Log-axis bounds as the powers of ten that BRACKET the data.
 *
 * The domain has to cover the real extremes, not just clamp to a guess: a point
 * pinned to the top axis flattens the last segment of the curve, and that
 * segment is the overload blow-up the chart exists to show. Returns null when
 * nothing is positive (a log axis has no meaning then).
 */
export const logDomain = (
  values: Array<number | null | undefined>
): { min: number; max: number } | null => {
  const pos = values.filter((v): v is number => typeof v === 'number' && v > 0);
  if (!pos.length) return null;
  const min = 10 ** Math.floor(Math.log10(Math.min(...pos)));
  const max = 10 ** Math.ceil(Math.log10(Math.max(...pos)));
  return { min, max: max <= min ? min * 10 : max };
};

/** Linear upper bound rounded up to a readable step. */
export const linearMax = (
  values: Array<number | null | undefined>
): number | undefined => {
  const nums = values.filter(
    (v): v is number => typeof v === 'number' && v > 0
  );
  if (!nums.length) return undefined;
  const max = Math.max(...nums);
  const step = 10 ** Math.floor(Math.log10(max)) / 2;
  return Math.ceil(max / step) * step;
};

/** Percentage delta, as a signed integer. */
export const pctDelta = (from: number, to: number): number | null =>
  from > 0 ? Math.round(((to - from) / from) * 100) : null;
