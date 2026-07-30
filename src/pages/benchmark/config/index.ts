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
  LatencySLA: 'Latency SLA',
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
    tips: 'benchmark.form.profile.latencySla.tips',
    value: ProfileValueMap.LatencySLA
  }
];

// `load_type` is the load axis (fixed_rate / concurrency); `auto_tune` toggles
// the adaptive ramp engine. The latency-SLA scenario = concurrency + auto_tune +
// sla targets. The create form's top selector is the Preset (profile); choosing
// one fills load_type + auto_tune + sla + dataset defaults.
export const LoadTypeValueMap = {
  FixedRate: 'fixed_rate',
  Concurrency: 'concurrency'
};

// Auto-tune budget defaults, kept in sync with the benchmark-runner ramp engine
// (AutoTuneConfig / the CLI defaults) AND with the shipped presets in
// profiles_config.yaml — all three now agree on 3600s, so a Custom run and a
// preset get the same budget instead of Custom silently stopping at half of it.
// Prefilled into the form so the effective values are visible/editable rather
// than applied at runtime. multiplier/min_requests stay internal (not surfaced).
export const AUTO_TUNE_DEFAULTS = {
  lower_bound: 4,
  upper_bound: 1024,
  max_points: 12,
  max_total_seconds: 3600
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
  sla_never_met: 'benchmark.detail.validity.slaNeverMet',
  sla_not_binding: 'benchmark.detail.validity.slaNotBinding',
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
  sla_failed: 'benchmark.detail.stopReason.slaFailed',
  converged: 'benchmark.detail.stopReason.converged',
  overloaded: 'benchmark.detail.stopReason.overloaded',
  point_failed: 'benchmark.detail.stopReason.pointFailed'
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

// ── Latency SLA thresholds ───────────────────────────────────────────────────
// The API carries them as 9 flat "<= ms" columns (3 metrics x 3 aggregations,
// `sla_{avg,p95,p99}_{ttft,tpot,latency}_ms`), any subset of which may be set;
// a point meets the SLA when EVERY set threshold holds (AND).
//
// The form edits them as a LIST instead of one row per metric, so a single
// metric can carry more than one aggregation — "TTFT avg <= 500 AND TTFT p99 <=
// 2000" is a normal thing to ask for and a per-metric selector cannot express
// it. `sla_targets` is a form-only field: every mutation writes through to the 9
// flat fields, and it is stripped before the request (see the benchmark page's
// handleModalOk).
export const SLA_METRICS = [
  { value: 'ttft', label: 'benchmark.form.sla.metric.ttft' },
  { value: 'tpot', label: 'benchmark.form.sla.metric.tpot' },
  { value: 'latency', label: 'benchmark.form.sla.metric.latency' }
] as const;

export const SLA_AGGS = [
  { value: 'avg', label: 'benchmark.form.sla.agg.avg' },
  { value: 'p95', label: 'benchmark.form.sla.agg.p95' },
  { value: 'p99', label: 'benchmark.form.sla.agg.p99' }
] as const;

export type SlaMetric = (typeof SLA_METRICS)[number]['value'];
export type SlaAgg = (typeof SLA_AGGS)[number]['value'];

export interface SlaTarget {
  metric?: SlaMetric;
  agg?: SlaAgg;
  value?: number | null;
}

export const slaFieldName = (metric: SlaMetric, agg: SlaAgg) =>
  `sla_${agg}_${metric}_ms`;

export const SLA_FIELD_NAMES = SLA_METRICS.flatMap((m) =>
  SLA_AGGS.map((a) => slaFieldName(m.value, a.value))
);

/**
 * Does this profile let the run have an SLA target?
 *
 * SLA is a TARGET, not an extra constraint: setting any threshold switches the
 * auto-tune answer from "peak throughput" to "the maximum load still meeting the
 * SLA" (the runner derives the target from whether any threshold is set). So it is
 * mutually exclusive with a peak-throughput preset — "Max Throughput + SLA" is not
 * a throughput run with a latency budget, it is a different question, and the
 * preset label would stop describing what was delivered. Switching to Custom (or
 * Latency SLA) is how you ask that other question, and the label changes with you.
 *
 * Deliberately NOT gated on the load axis, which is what this used to do. "The most
 * req/s under TTFT <= 500ms" is as legitimate as its concurrency form — and better
 * instrumented (only the rate axis can compare achieved vs offered, which is what
 * `saturated_at_lower_bound` and the ramp's can't-keep-up signal are built on). The
 * backend and engine have always accepted SLA on both axes; only the form refused.
 */
export const profileAllowsSla = (
  profile?: string,
  profilesOptions?: { value?: string; config?: Record<string, any> }[]
): boolean => {
  if (!profile || profile === ProfileValueMap.Custom) return true;
  const config = profilesOptions?.find((o) => o.value === profile)?.config;
  // Unknown preset (list still loading, or one added server-side that this build
  // doesn't know): show the section rather than silently removing a capability.
  if (!config) return true;
  return SLA_FIELD_NAMES.some((name) => config[name] != null);
};

export const slaTargetKey = (metric?: SlaMetric, agg?: SlaAgg) =>
  `${metric ?? ''}:${agg ?? ''}`;

/** Flat API fields -> form list, in metric-then-aggregation order. */
export const slaTargetsFromFields = (source: any): SlaTarget[] => {
  const out: SlaTarget[] = [];
  SLA_METRICS.forEach((m) => {
    SLA_AGGS.forEach((a) => {
      const value = source?.[slaFieldName(m.value, a.value)];
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
export const slaFieldsFromTargets = (
  targets: SlaTarget[] = []
): Record<string, number | null> => {
  const out: Record<string, number | null> = {};
  SLA_FIELD_NAMES.forEach((name) => {
    out[name] = null;
  });
  // `|| []` as well as the default: the default only fires for undefined, and a
  // record whose sla_targets came back null would otherwise throw here.
  (targets || []).forEach((t) => {
    if (t?.metric && t?.agg && t?.value != null) {
      out[slaFieldName(t.metric, t.agg)] = t.value;
    }
  });
  return out;
};
