export interface ComputedResourceClaim {
  is_unified_memory: boolean;
  offload_layers: number;
  total_layers: number;
  ram: number;
  vram: Record<string, number>;
  tensor_split: number[];
  vram_utilization: number;
}

export interface ComputedResourceClaim1 {
  is_unified_memory: boolean;
  offload_layers: number;
  total_layers: number;
  ram: number;
  vram: Record<string, number>;
  tensor_split: number[];
  vram_utilization: number;
}

export interface SubordinateWorkersItem {
  computed_resource_claim: ComputedResourceClaim1;
  ports: number[];
  worker_id: number;
  worker_name: string;
  gpu_type: string;
  gpu_indexes: number[];
  gpu_ids: string[];
}

export interface InstanceSnapshot {
  computed_resource_claim: ComputedResourceClaim;
  ports: number[];
  worker_id: number;
  worker_name: string;
  gpu_type: string;
  gpu_indexes: number[];
  gpu_ids: string[];
  id: number;
  name: string;
  state: string;
  state_message: string;
  backend: string;
  backend_version: string;
  api_detected_backend_version: string;
  subordinate_workers: SubordinateWorkersItem[];
}

export interface GPUSnapshot {
  vendor: string;
  type: string;
  index: number;
  device_index: number;
  device_chip_index: number;
  arch_family: string;
  name: string;
  uuid: string;
  driver_version: string;
  runtime_version: string;
  compute_capability: string;
  id: string;
  worker_id: number;
  worker_name: string;
  memory_total: number;
  core_total: number;
}

export interface FormData {
  name: string;
  profile: string;
  description: string;
  labels: Record<string, string>;
  cluster_id: number;
  model_id: number;
  model_name: string;
  model_instance_name: string;
  dataset_name: string;
  dataset_input_tokens: number;
  dataset_output_tokens: number;
  total_requests: number;
  request_rate: number;
  dataset_seed: number;
  // Provenance of dataset_seed, not part of choosing it: true = randomly
  // generated (the input is read-only), false = pinned by the user for a
  // reproducible run. On clone a random seed is re-rolled, a pinned one is kept.
  dataset_seed_random?: boolean;
  // Multi-stage seed policy: true = each stage's seed increments (base + index);
  // false = fixed across stages. Only meaningful for the Random dataset.
  dataset_seed_increment?: boolean;
  model_instance?: string;
  // Load axis.
  load_type?: string; // fixed_rate / concurrency
  // Auto-tune (adaptive ramp): when true, the engine ramps the load axis instead
  // of running user-specified stages, and auto-detects the answer.
  auto_tune?: boolean;
  // Auto-tune budget / bounds (used when auto_tune=true). multiplier/min_requests
  // are internal defaults and not exposed in the form.
  lower_bound?: number;
  upper_bound?: number;
  max_points?: number;
  max_total_seconds?: number;
  // Manual stages: per-stage independent constraints (only when auto_tune=false)
  stages?: StageRow[];
  // Global duration cap (guidellm --max-seconds) for non-stage runs
  max_seconds?: number;
  // Latency SLA targets — optional "<= (ms)"; a point meets the SLA when every
  // set threshold holds (AND) + success >= 95%. avg + p95 + p99 of TTFT / TPOT /
  // e2e latency.
  sla_avg_ttft_ms?: number; // avg TTFT
  sla_avg_tpot_ms?: number; // avg TPOT
  sla_p95_ttft_ms?: number;
  sla_p95_tpot_ms?: number;
  sla_p99_ttft_ms?: number;
  sla_p99_tpot_ms?: number;
  sla_avg_latency_ms?: number;
  sla_p95_latency_ms?: number;
  sla_p99_latency_ms?: number;
  output_tokens?: number;
  // Data distribution (spread token lengths around the mean)
  dataset_input_stdev?: number;
  dataset_input_min?: number;
  dataset_input_max?: number;
  dataset_output_stdev?: number;
  dataset_output_min?: number;
  dataset_output_max?: number;
  // Shared prefix (system prompt / RAG context, prefix-cache reuse)
  prefix_buckets?: PrefixBucket[];
  // Advanced
  turns?: number;
  warmup?: number;
  cooldown?: number;
  max_errors?: number;
  max_error_rate?: number;
  stop_on_saturation?: boolean;
  // Best operating points (server-computed, persisted on the parent row).
  peak_rate?: number;
  sla_met_rate?: number;
  recommended_rate?: number;
  // Test-coverage validity (server-computed; language-neutral codes).
  validity?: {
    // Absent while `in_progress`: mid-sweep there is no verdict to give.
    sufficient?: boolean;
    warnings?: { code: string; params?: Record<string, unknown> }[];
    // Why the ramp stopped, straight from the engine that stopped it (absent for
    // stage / legacy runs and for rows written before the runner reported it).
    stop_reason?: string;
    stopped_at?: number;
    // Whether `sla_met_rate` is a measured boundary ("257 breaks it") or only a
    // floor (">= 256, the search ended first"). Absent when no SLA was set.
    sla_boundary_located?: boolean;
    // The saturation probe's reading, the soft cap it produced, and how many times
    // that cap gave way. Together they say whether the probe earned its cost:
    // relaxed > 0 = it read low; stopped_at == bound = it clamped the overshoot
    // point; stopped_at < bound = it never bound anything.
    probe_ceiling?: number;
    probe_bound?: number;
    probe_relaxed?: number;
    // Set by the worker's partial syncs, dropped by the terminal one. While it is
    // set the analysis is still firming up, so nothing here may be rendered as a
    // conclusion.
    in_progress?: boolean;
  };
}

// One stage row: a single rate with its own optional constraints.
export interface StageRow {
  rate: number;
  max_requests?: number | null;
  max_seconds?: number | null;
}

// One shared-prefix bucket (guidellm prefix_buckets).
export interface PrefixBucket {
  prefix_tokens: number; // prefix length in tokens
  prefix_count?: number | null; // number of unique prefixes in this bucket
  bucket_weight?: number | null; // weight in the overall prefix distribution
}

// One measured (input_tokens, rate) point, from GET /benchmarks/{id}/results.
export interface BenchmarkResultItem {
  id: number;
  benchmark_id: number;
  input_tokens: number | null;
  rate: number | null;
  strategy_type: string | null;
  sequence: number;
  requests_per_second_mean: number | null;
  request_latency_mean: number | null;
  time_per_output_token_mean: number | null;
  inter_token_latency_mean: number | null;
  time_to_first_token_mean: number | null;
  // Tail percentiles of the SLA-relevant latency metrics. TTFT / TPOT are ms,
  // request latency is seconds (same units as their *_mean counterparts).
  //
  // TPOT means `inter_token_latency_*` — decode only, the industry definition,
  // and what the sla_*_tpot_ms thresholds are judged on. The
  // `time_per_output_token_*` pair is guidellm's includes-TTFT variant: still
  // returned by the API, not displayed and not judged on.
  time_to_first_token_p95: number | null;
  inter_token_latency_p95: number | null;
  time_per_output_token_p95: number | null;
  request_latency_p95: number | null;
  time_to_first_token_p99: number | null;
  inter_token_latency_p99: number | null;
  time_per_output_token_p99: number | null;
  request_latency_p99: number | null;
  tokens_per_second_mean: number | null;
  output_tokens_per_second_mean: number | null;
  input_tokens_per_second_mean: number | null;
  request_concurrency_mean: number | null;
  request_concurrency_max: number | null;
  request_total: number | null;
  request_successful: number | null;
  request_errored: number | null;
  request_incomplete: number | null;
  // This stage's benchmarks[i] dump (includes percentiles) for drill-down.
  raw_metrics?: any;
  created_at: string;
  updated_at: string;
}

export interface BenchmarkListItem extends FormData {
  id: number;
  // Inherited from the parent cluster's owner_principal_id on the
  // wire so per-row tenant filtering works without joining.
  owner_principal_id?: number | null;
  created_at: string;
  updated_at: string;
  state: string;
  state_message: string;
  progress: number;
  instance_snapshot: InstanceSnapshot;
  gpu_snapshot: GPUSnapshot[];
}

export interface ProfileOption {
  name: string;
  description: string;
  dataset_name: string;
  dataset_source: string;
  dataset_input_tokens: number;
  dataset_output_tokens: number;
  request_rate: number;
  total_requests: number;
  // preset fields (filled into the form when a preset is selected)
  load_type?: string;
  auto_tune?: boolean;
  lower_bound?: number;
  upper_bound?: number;
  max_points?: number;
  max_total_seconds?: number;
  max_seconds?: number;
  stages?: StageRow[];
  sla_avg_ttft_ms?: number;
  sla_avg_tpot_ms?: number;
  sla_p95_ttft_ms?: number;
  sla_p95_tpot_ms?: number;
  sla_p99_ttft_ms?: number;
  sla_p99_tpot_ms?: number;
  sla_avg_latency_ms?: number;
  sla_p95_latency_ms?: number;
  sla_p99_latency_ms?: number;
  dataset_seed?: number;
}
