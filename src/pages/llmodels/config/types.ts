export interface ListItem {
  source: string;
  backend: string;
  categories?: string[];
  reranker: boolean;
  image_only?: boolean;
  huggingface_repo_id: string;
  huggingface_file_name: string;
  backend_version?: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_file_path: string;
  model_scope_model_id: string;
  embedding_only?: boolean;
  ready_replicas: number;
  speech_to_text?: boolean;
  text_to_speech?: boolean;
  replicas: number;
  s3Address: string;
  name: string;
  description: string;
  id: number;
  local_path?: string;
  created_at: string;
  updated_at: string;
  gpu_selector?: {
    gpu_ids: string[];
  };
  worker_selector?: object;
}

export type SourceType =
  | 'huggingface'
  | 'model_scope'
  | 'local_path'
  | 'ollama_library';

export interface FormData {
  backend: string;
  restart_on_error?: boolean;
  env?: Record<string, any>;
  size?: number;
  quantization?: number;
  categories?: string[];
  backend_parameters?: string[];
  backend_version?: string;
  source: string;
  repo_id: string;
  file_name: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  s3_address: string;
  ollama_library_model_name: string;
  distributed_inference_across_workers?: boolean;
  local_path?: string;
  model_scope_model_id?: string;
  model_scope_file_path?: string;
  gpu_selector?: {
    gpu_ids: string[];
  };
  placement_strategy?: string;
  cpu_offloading?: boolean;
  worker_selector?: object;
  scheduleType?: string;
  name: string;
  replicas: number;
  description: string;
}

interface ComputedResourceClaim {
  offload_layers: number;
  total_layers: number;
  ram: number;
  vram: Record<string, number>;
}

export interface DistributedServerItem {
  pid: number;
  port: number;
  worker_id: string;
  computed_resource_claim: ComputedResourceClaim;
}

export interface DistributedServers {
  rpc_servers: DistributedServerItem[];
  ray_actors: DistributedServerItem[];
  subordinate_workers: DistributedServerItem[];
}
export interface ModelInstanceListItem {
  backend?: string;
  backend_version?: string;
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  distributed_servers?: DistributedServers;
  computed_resource_claim?: ComputedResourceClaim;
  s3_address: string;
  worker_id: number;
  gpu_indexes?: number[];
  worker_ip: string;
  gpu_index: number;
  pid: number;
  port: number;
  name: string;
  state: string;
  state_message: string;
  download_progress: number;
  model_id: number;
  model_name: string;
  worker_name: string;
  id: number;
  created_at: string;
  updated_at: string;
}

export interface ModelInstanceFormData {
  model_id: number;
  model_name: string;
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
}

export interface GPUListItem {
  name: string;
  uuid: string;
  vendor: string;
  index: number;
  core: {
    total: number;
    utilization_rate: number;
  };
  memory: {
    total: number;
    utilization_rate: number;
    is_unified_memory: boolean;
    used: number;
    allocated: number;
  };
  temperature: number;
  id: string;
  worker_id: number;
  worker_name: string;
  worker_ip: string;
}

export interface CatalogItem {
  name: string;
  id: number;
  description: string;
  home: string;
  icon: string;
  categories: string[];
  capabilities: string[];
  sizes: number[];
  licenses: string[];
  release_date: string;
}

export interface CatalogSpec {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_model_id: string;
  model_scope_file_path: string;
  local_path: string;
  name: string;
  description: string;
  meta: Record<string, any>;
  replicas: number;
  ready_replicas: number;
  categories: any[];
  placement_strategy: string;
  cpu_offloading: boolean;
  distributed_inference_across_workers: boolean;
  worker_selector: Record<string, any>;
  gpu_selector: {
    gpu_ids: string[];
  };
  backend: string;
  backend_version: string;
  backend_parameters: any[];
  quantization: string;
  size: number;
}

export interface EvaluateSpec {
  source?: string;
  huggingface_repo_id?: string;
  huggingface_filename?: string;
  ollama_library_model_name?: string;
  model_scope_model_id?: string;
  model_scope_file_path?: string;
  local_path?: string;
  name?: string;
  description?: string;
  meta?: Record<string, any>;
  replicas?: number;
  ready_replicas?: number;
  categories?: any[];
  placement_strategy?: string;
  cpu_offloading?: boolean;
  distributed_inference_across_workers?: boolean;
  worker_selector?: Record<string, any>;
  gpu_selector?: {
    gpu_ids: string[];
  };
  backend?: string;
  backend_version?: string;
  backend_parameters?: any[];
  env?: Record<string, any>;
  distributable?: boolean;
  quantization?: string;
  size?: number;
}

export interface EvaluateResult {
  compatible: boolean;
  compatibility_messages: string[];
  scheduling_messages: string[];
  default_spec: Record<string, any>;
  error?: boolean;
  error_message?: string;
  resource_claim?: {
    ram: number;
    vram: number;
  };
}
