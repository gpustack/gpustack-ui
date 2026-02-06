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
  name: string;
  description: string;
  labels: Record<string, any>;
  dataset_id: number;
  dataset_name: string;
  dataset_source: string;
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
