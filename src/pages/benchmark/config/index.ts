import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const BenchmarkStatusValueMap = {
  Pending: 'pending',
  QUEUED: 'queued',
  Running: 'running',
  Completed: 'completed',
  Error: 'error',
  Stopped: 'stopped',
  Unreachable: 'unreachable'
};

export const BenchmarkStatusLabelMap = {
  [BenchmarkStatusValueMap.Pending]: 'Pending',
  [BenchmarkStatusValueMap.QUEUED]: 'Queued',
  [BenchmarkStatusValueMap.Running]: 'Running',
  [BenchmarkStatusValueMap.Completed]: 'Completed',
  [BenchmarkStatusValueMap.Error]: 'Error',
  [BenchmarkStatusValueMap.Stopped]: 'Stopped',
  [BenchmarkStatusValueMap.Unreachable]: 'Unreachable'
};

export const BenchmarkStatus: Record<string, StatusType> = {
  [BenchmarkStatusValueMap.Pending]: StatusMaps.transitioning,
  [BenchmarkStatusValueMap.QUEUED]: StatusMaps.warning,
  [BenchmarkStatusValueMap.Running]: StatusMaps.success,
  [BenchmarkStatusValueMap.Completed]: StatusMaps.success,
  [BenchmarkStatusValueMap.Error]: StatusMaps.error,
  [BenchmarkStatusValueMap.Unreachable]: StatusMaps.error,
  [BenchmarkStatusValueMap.Stopped]: StatusMaps.warning
};

export const ProfileValueMap = {
  MaxThroughput: 'Max Throughput',
  LatencySLO: 'Meet Latency SLO',
  Custom: 'Custom'
};

export const ProfileLabelMap = {
  [ProfileValueMap.Custom]: 'benchmark.form.profile.custom'
};

// Preset name (as returned by the API / defined in profiles_config.yaml) -> the
// i18n key for its blurb under the selector. `label` is deliberately absent for
// the named presets: the preset name IS the label and is stored verbatim in
// `benchmark.profile`, so translating it would make the drawer and the table
// disagree with the API value.
//
// These entries used to key off an older preset set (Latency / Throughput /
// Long Context / ...) that no longer exists, so nothing ever matched: `tips`
// resolved to '' and the selector fell back to the yaml `description` — i.e. the
// blurb was English in all five languages.
export const profileOptions = [
  {
    tips: 'benchmark.form.profile.maxThroughput.tips',
    value: ProfileValueMap.MaxThroughput
  },
  {
    tips: 'benchmark.form.profile.latencySlo.tips',
    value: ProfileValueMap.LatencySLO
  }
];

// `load_type` is the load axis (fixed_rate / concurrency); `auto_tune` toggles
// the adaptive ramp engine. The latency-SLO scenario = concurrency + auto_tune +
// slo targets. The create form's top selector is the Preset (profile); choosing
// one fills load_type + auto_tune + slo + dataset defaults.
export const LoadTypeValueMap = {
  FixedRate: 'fixed_rate',
  Concurrency: 'concurrency'
};

// Auto-tune budget defaults for a Custom run, and the fallback when a preset
// leaves a field out. Prefilled into the form so the effective values are
// visible/editable rather than applied at runtime. multiplier/min_requests stay
// internal (not surfaced).
//
// These mirror benchmark-runner's AutoTuneConfig, which is sized for the
// EXPENSIVE case — an SLO bisection on a large deployment, where the interval is
// the answer and each point halves it. The named presets carry their own budgets
// (see profiles_config.yaml) because a goal whose answer is an argmax needs far
// fewer points; Custom cannot know which goal the user is after, so it takes the
// budget that covers both.
//
// Every one of these is a CEILING, not a quota: a converged search stops early,
// so a small deployment finishes in a handful of points however high the cap is.
// Sizing them for the large case therefore costs the small case nothing.
export const AUTO_TUNE_DEFAULTS = {
  lower_bound: 4,
  // Deliberately far above any deployment we expect. Too high is free (Phase 1
  // ends on saturation or the SLO breach first); too low makes the range end the
  // reported answer — a number nothing measured.
  upper_bound: 8192,
  max_points: 18,
  max_total_seconds: 5400
};

// Random-dataset seed range. The ceiling stays below 2**32 (the seed limit on the
// generator side) because a multi-stage run derives each stage's seed as
// base + stage index, so a base near the limit would overflow on the last
// stages. Mirrors DATASET_SEED_MIN / MAX in gpustack/schemas/benchmark.py.
export const DATASET_SEED_MIN = 1;
export const DATASET_SEED_MAX = 2 ** 31 - 1;

// A fresh seed, so two runs of the same config send different synthetic prompts
// instead of one replaying the other's prefix cache. Generated here rather than
// on the server so the value is visible in the form before submitting; the server
// only fills it in when a client sends none.
export const genDatasetSeed = () =>
  DATASET_SEED_MIN +
  Math.floor(Math.random() * (DATASET_SEED_MAX - DATASET_SEED_MIN + 1));

export const loadTypeOptions = [
  {
    label: 'benchmark.form.loadType.fixedRate',
    value: LoadTypeValueMap.FixedRate
  },
  {
    label: 'benchmark.form.loadType.concurrency',
    value: LoadTypeValueMap.Concurrency
  }
];

// The x-axis / first-column label: a concurrency-based load (stages or the
// concurrency load type) is measured in concurrent requests; a fixed-rate load
// is measured in request rate. Show only the relevant one instead of the
// ambiguous "Rate / Concurrency".
export const loadAxisLabelId = (d?: {
  load_type?: string;
  stages?: unknown[] | null;
}): string =>
  // `load_type` is authoritative. Only fall back to the "has stages" heuristic
  // for legacy records with no load_type — otherwise a fixed-rate sweep (which
  // also has stages) would be mislabeled as concurrency.
  d?.load_type === LoadTypeValueMap.Concurrency ||
  (d?.load_type == null && (d?.stages?.length ?? 0) > 0)
    ? 'benchmark.form.concurrency'
    : 'benchmark.table.requestRate';

// The same label for a CHART AXIS, which has to carry the unit: axis ticks are
// bare numbers (4, 8, 16, 29), so without it the reader has nothing telling them
// whether 29 means requests per second or requests in flight. Kept apart from
// `loadAxisLabelId` because that one also names a table column and a tooltip row,
// where the value already sits next to its unit and repeating it in the label
// reads as "Request Rate (req/s) 29 req/s".
export const loadAxisTitleId = (d?: {
  load_type?: string;
  stages?: unknown[] | null;
}): string =>
  loadAxisLabelId(d) === 'benchmark.form.concurrency'
    ? 'benchmark.detail.chart.axis.load.concurrency'
    : 'benchmark.detail.chart.axis.load.rate';

// Concurrency is an integer (# of concurrent requests); request rate is a
// continuous req/s frequency, so show it with one decimal.
export const loadValueDecimals = (d?: {
  load_type?: string;
  stages?: unknown[] | null;
}): number => (loadAxisLabelId(d) === 'benchmark.form.concurrency' ? 0 : 1);

// Auto-generate a benchmark name: {model}-{profile}-{MMdd-HHmm}-{3 random}.
// Slugged + length-bounded so it always satisfies the name pattern
// (^[A-Za-z0-9][A-Za-z0-9._-]{0,61}[A-Za-z0-9]$).
export const genBenchmarkName = (model?: string, profile?: string): string => {
  const slug = (s: string | undefined, max: number) =>
    (s || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, max);
  const m = slug(model, 24) || 'benchmark';
  const p = slug(profile, 20) || 'custom';
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
  const rand = (Math.random().toString(36) + '000').slice(2, 5);
  return `${m}-${p}-${ts}-${rand}`;
};

// Map backend validity warning `code` -> i18n key (backend emits codes + params;
// the UI localizes them). Used by the detail banner and the list Coverage column.
export const VALIDITY_MESSAGE_KEY: Record<string, string> = {
  slo_never_met: 'benchmark.detail.validity.sloNeverMet',
  slo_not_binding: 'benchmark.detail.validity.sloNotBinding',
  not_saturated: 'benchmark.detail.validity.notSaturated',
  budget_exhausted: 'benchmark.detail.validity.budgetExhausted',
  saturated_at_lower_bound: 'benchmark.detail.validity.saturatedAtLowerBound',
  peak_at_floor: 'benchmark.detail.validity.peakAtFloor',
  point_high_error: 'benchmark.detail.validity.pointHighError',
  few_points: 'benchmark.detail.validity.fewPoints'
};

// Why the adaptive ramp stopped where it did, reported by benchmark-runner rather
// than guessed from the curve (several terminations leave identical grids). Shown
// next to the stage count, which is the number it explains: a 7-of-12-point run
// used to end with no indication of what ended it.
//
// Absent for stage / legacy runs and for rows measured before the runner started
// reporting it — render nothing rather than "unknown".
export const STOP_REASON_LABEL: Record<string, string> = {
  capacity_plateau: 'benchmark.detail.stopReason.capacityPlateau',
  upper_bound: 'benchmark.detail.stopReason.upperBound',
  budget_points: 'benchmark.detail.stopReason.budgetPoints',
  budget_seconds: 'benchmark.detail.stopReason.budgetSeconds',
  slo_failed: 'benchmark.detail.stopReason.sloFailed',
  converged: 'benchmark.detail.stopReason.converged',
  overloaded: 'benchmark.detail.stopReason.overloaded',
  point_failed: 'benchmark.detail.stopReason.pointFailed',
  // Not the user's range: the saturation probe's own cap, which it
  // re-derives every run. Only reachable when lower_bound already sits
  // above it — hence its own label instead of "the range ceiling".
  probe_bound: 'benchmark.detail.stopReason.probeBound'
};

export const DatasetValueMap = {
  ShareGPT: 'ShareGPT',
  Random: 'Random'
};

export const datasetList = [
  {
    name: 'ShareGPT',
    label: 'ShareGPT',
    value: DatasetValueMap.ShareGPT
  },
  {
    name: 'Random',
    label: 'Random',
    value: DatasetValueMap.Random
  }
];

// ── Latency SLO thresholds ───────────────────────────────────────────────────
// The API carries them as 9 flat "<= ms" columns (3 metrics x 3 aggregations,
// `slo_{avg,p95,p99}_{ttft,tpot,latency}_ms`), any subset of which may be set;
// a point meets the SLO when EVERY set threshold holds (AND).
//
// The form edits them as a LIST instead of one row per metric, so a single
// metric can carry more than one aggregation — "TTFT avg <= 500 AND TTFT p99 <=
// 2000" is a normal thing to ask for and a per-metric selector cannot express
// it. `slo_targets` is a form-only field and the ONLY one the SLO section
// registers; the benchmark page's handleModalOk EXPANDS it back into the 9 flat
// fields at submit time. It is not written through to them in the form — antd's
// onFinish only carries registered fields, so a value sitting in the store with
// no Form.Item would never reach the request.
export const SLO_METRICS = [
  { value: 'ttft', label: 'benchmark.form.slo.metric.ttft' },
  { value: 'tpot', label: 'benchmark.form.slo.metric.tpot' },
  { value: 'latency', label: 'benchmark.form.slo.metric.latency' }
] as const;

export const SLO_AGGS = [
  { value: 'avg', label: 'benchmark.form.slo.agg.avg' },
  { value: 'p95', label: 'benchmark.form.slo.agg.p95' },
  { value: 'p99', label: 'benchmark.form.slo.agg.p99' }
] as const;

export type SloMetric = (typeof SLO_METRICS)[number]['value'];
export type SloAgg = (typeof SLO_AGGS)[number]['value'];

export interface SloTarget {
  metric?: SloMetric;
  agg?: SloAgg;
  value?: number | null;
}

export const sloFieldName = (metric: SloMetric, agg: SloAgg) =>
  `slo_${agg}_${metric}_ms`;

export const SLO_FIELD_NAMES = SLO_METRICS.flatMap((m) =>
  SLO_AGGS.map((a) => sloFieldName(m.value, a.value))
);

/**
 * Does this profile let the run have an SLO target?
 *
 * SLO is a TARGET, not an extra constraint: setting any threshold switches the
 * auto-tune answer from "peak throughput" to "the maximum load still meeting the
 * SLO" (the runner derives the target from whether any threshold is set). So it is
 * mutually exclusive with a peak-throughput preset — "Max Throughput + SLO" is not
 * a throughput run with a latency budget, it is a different question, and the
 * preset label would stop describing what was delivered. Switching to Custom (or
 * Latency SLO) is how you ask that other question, and the label changes with you.
 *
 * Deliberately NOT gated on the load axis, which is what this used to do. "The most
 * req/s under TTFT <= 500ms" is as legitimate as its concurrency form — and better
 * instrumented (only the rate axis can compare achieved vs offered, which is what
 * `saturated_at_lower_bound` and the ramp's can't-keep-up signal are built on). The
 * backend and engine have always accepted SLO on both axes; only the form refused.
 */
export const profileAllowsSlo = (
  profile?: string,
  profilesOptions?: { value?: string; config?: Record<string, any> }[]
): boolean => {
  if (!profile || profile === ProfileValueMap.Custom) return true;
  const config = profilesOptions?.find((o) => o.value === profile)?.config;
  // Unknown preset (list still loading, or one added server-side that this build
  // doesn't know): show the section rather than silently removing a capability.
  if (!config) return true;
  return SLO_FIELD_NAMES.some((name) => config[name] != null);
};

export const sloTargetKey = (metric?: SloMetric, agg?: SloAgg) =>
  `${metric ?? ''}:${agg ?? ''}`;

/** Flat API fields -> form list, in metric-then-aggregation order. */
export const sloTargetsFromFields = (source: any): SloTarget[] => {
  const out: SloTarget[] = [];
  SLO_METRICS.forEach((m) => {
    SLO_AGGS.forEach((a) => {
      const value = source?.[sloFieldName(m.value, a.value)];
      if (value != null) {
        out.push({ metric: m.value, agg: a.value, value });
      }
    });
  });
  return out;
};

/**
 * Form list -> flat API fields. Every one of the 9 is written, unused ones as
 * null: a row that switches metric or aggregation must clear the field it used
 * to populate, or the run would silently keep enforcing the old threshold.
 */
export const sloFieldsFromTargets = (
  targets: SloTarget[] = []
): Record<string, number | null> => {
  const out: Record<string, number | null> = {};
  SLO_FIELD_NAMES.forEach((name) => {
    out[name] = null;
  });
  // `|| []` as well as the default: the default only fires for undefined, and a
  // record whose slo_targets came back null would otherwise throw here.
  (targets || []).forEach((t) => {
    if (t?.metric && t?.agg && t?.value != null) {
      out[sloFieldName(t.metric, t.agg)] = t.value;
    }
  });
  return out;
};
