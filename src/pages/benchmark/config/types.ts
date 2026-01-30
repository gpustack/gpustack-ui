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
  dataset_id: number;
  dataset_name: string;
  dataset_source: string;
  dataset_input_tokens: number;
  dataset_output_tokens: number;
  total_requests: number;
  request_rate: number;
  dataset_seed: number;
  model_instance?: string;
}

export interface BenchmarkListItem extends FormData {
  id: number;
  created_at: string;
  updated_at: string;
  state: string;
  state_message: string;
  progress: number;
  instance_snapshot: InstanceSnapshot;
  gpu_snapshot: GPUSnapshot[];
}

export interface DatasetListItem {
  name: string;
  source: string;
  prompt_tokens: number;
  output_tokens: number;
  id: number;
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
}
