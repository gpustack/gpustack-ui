import { PrefixBucket, StageRow } from './types';

export interface ComputedResourceClaim {
  is_unified_memory: boolean;
  offload_layers: any;
  total_layers: any;
  ram: any;
  vram: Record<string, number>;
  tensor_split: any;
  vram_utilization: any;
}

export interface InstancesData {
  computed_resource_claim: ComputedResourceClaim;
  ports: number[];
  worker_id: number;
  worker_name: string;
  worker_ip: string;
  gpu_type: string;
  gpu_indexes: number[];
  gpu_ids: string[];
  id: number;
  name: string;
  resolved_path: string;
  state: string;
  state_message: string;
  backend: any;
  backend_version: any;
  api_detected_backend_version: any;
  backend_parameters: any;
  injected_backend_parameters: string[];
  image_name: any;
  run_command: any;
  env: any;
  extended_kv_cache: any;
  speculative_config: any;
  subordinate_workers: any[];
}

export interface WorkerData {
  id: number;
  name: string;
  cpu_total: number;
  memory_total: number;
  os: {
    name: string;
    version: string;
  };
}

export interface GPUData {
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

export interface Snapshot {
  instances: Record<string, InstancesData>;
  workers: Record<string, WorkerData>;
  gpus: Record<string, GPUData>;
}
export interface BenchmarkDetail {
  // Dataset shape, stages, execution caps and the advanced knobs: the detail
  // endpoint returns the same row the form wrote, so the config side of the
  // record is declared here rather than reached through a cast. The Configuration
  // tab renders every one of these.
  dataset_input_stdev?: number;
  dataset_input_min?: number;
  dataset_input_max?: number;
  dataset_output_stdev?: number;
  dataset_output_min?: number;
  dataset_output_max?: number;
  prefix_buckets?: PrefixBucket[];
  stages?: StageRow[];
  max_seconds?: number;
  max_errors?: number;
  max_error_rate?: number;
  stop_on_saturation?: boolean;
  turns?: number;
  warmup?: number;
  cooldown?: number;
  profile: string;
  dataset_seed: number;
  raw_metrics: {
    benchmarks: Array<{
      metrics: Record<string, any>;
    }>;
    [key: string]: any;
  };
  requests_per_second_mean: number;
  request_latency_mean: number;
  time_per_output_token_mean: number;
  inter_token_latency_mean: number;
  time_to_first_token_mean: number;
  tokens_per_second_mean: number;
  output_tokens_per_second_mean: number;
  input_tokens_per_second_mean: number;
  // load / auto-tune / SLA / best operating points
  load_type?: string;
  auto_tune?: boolean;
  lower_bound?: number;
  upper_bound?: number;
  max_points?: number;
  max_total_seconds?: number;
  sla_avg_ttft_ms?: number;
  sla_avg_tpot_ms?: number;
  sla_p95_ttft_ms?: number;
  sla_p95_tpot_ms?: number;
  sla_p99_ttft_ms?: number;
  sla_p99_tpot_ms?: number;
  sla_avg_latency_ms?: number;
  sla_p95_latency_ms?: number;
  sla_p99_latency_ms?: number;
  sla_met_rate?: number;
  peak_rate?: number;
  recommended_rate?: number;
  // Test-coverage validity, computed on the backend (language-neutral codes +
  // params; the UI localizes them).
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
    // Worker's partial syncs set this; the terminal sync drops it. While set,
    // nothing in here may be rendered as a conclusion.
    in_progress?: boolean;
  };
  name: string;
  description: string;
  labels: Record<string, any>;
  dataset_name: string;
  dataset_input_tokens: number;
  dataset_output_tokens: number;
  cluster_id: number;
  model_id: number;
  model_name: string;
  model_instance_name: string;
  request_rate: number;
  total_requests: number;
  state: string;
  state_message: any;
  progress: any;
  worker_id: number;
  pid: number;
  snapshot: Snapshot;
  gpu_summary: string;
  gpu_vendor_summary: string;
  id: number;
  created_at: string;
  updated_at: string;
}

export interface BenchmarkMetricsFormData {
  requests_per_second_mean: number;
  request_latency_mean: number;
  time_per_output_token_mean: number;
  inter_token_latency_mean: number;
  time_to_first_token_mean: number;
  tokens_per_second_mean: number;
  output_tokens_per_second_mean: number;
  input_tokens_per_second_mean: number;
  raw_metrics: Record<string, any>;
}
