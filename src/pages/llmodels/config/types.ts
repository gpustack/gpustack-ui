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
  enable_model_route?: boolean;
  replicas: number;
  s3Address: string;
  name: string;
  description: string;
  id: number;
  cluster_id: number;
  local_path?: string;
  created_at: string;
  updated_at: string;
  access_policy: 'public' | 'authed' | 'allowed_users';
  generic_proxy?: boolean;
  gpu_selector?: {
    gpu_ids: string[];
    gpus_per_replica?: number;
  };
  worker_selector?: object;
}

export type DeployFormKey = 'deployment' | 'catalog';

export type SourceType =
  | 'huggingface'
  | 'model_scope'
  | 'local_path'
  | 'ollama_library';

export interface FormData {
  image_name?: string;
  run_command?: string;
  enable_model_route?: boolean;
  backend: string;
  restart_on_error?: boolean;
  env?: Record<string, any>;
  size?: number;
  quantization?: number;
  categories?: string[];
  backend_parameters?: string[];
  backend_version?: string;
  source: SourceType;
  huggingface_repo_id: string;
  huggingface_filename: string;
  s3_address: string;
  ollama_library_model_name: string;
  distributed_inference_across_workers?: boolean;
  local_path?: string;
  model_scope_model_id?: string;
  model_scope_file_path?: string;
  generic_proxy?: boolean;
  gpu_selector?: {
    gpu_ids?: string[];
    gpu_type?: string;
    gpu_count?: number;
    gpus_per_replica?: number;
  };
  placement_strategy?: string;
  cpu_offloading?: boolean;
  worker_selector?: object;
  scheduleType?: string;
  name: string;
  replicas: number;
  description: string;
  optimize_long_prompt: boolean;
  enable_speculative_decoding: boolean;
  cluster_id: number;
  extended_kv_cache: {
    enabled: boolean;
    chunk_size: number;
    ram_ratio: number;
    ram_size: number;
  };
  speculative_config: {
    enabled: boolean;
    algorithm: string;
    draft_model: string;
    num_draft_tokens: number;
    ngram_min_match_length: number;
    ngram_max_match_length: number;
  };
  max_context_len: number;
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
  subordinate_workers: DistributedServerItem[];
}
export interface ModelInstanceListItem {
  backend?: string;
  cluster_id: number;
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
  draft_model_source: {
    source: string;
    huggingface_repo_id: string;
    huggingface_filename: string;
    model_scope_model_id: string;
    model_scope_file_path: string;
    local_path: string;
  };
  draft_model_download_progress: 0;
  draft_model_resolved_path: string;
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
  deployment_notes?: string;
  home: string;
  icon: string;
  categories: string[];
  capabilities: string[];
  size: number;
  size_unit: string;
  activated_size: number;
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
  mode: string;
  distributed_inference_across_workers: boolean;
  worker_selector: Record<string, any>;
  gpu_selector: {
    gpu_ids: string[];
    gpus_per_replica: number;
  };
  extended_kv_cache: {
    enabled: boolean;
    chunk_size: number;
    max_local_cpu_size: number;
    remote_url: string;
  };
  speculative_config: {
    enabled: boolean;
    algorithm: string;
    draft_model: string;
    num_draft_tokens: number;
    ngram_min_match_length: number;
    ngram_max_match_length: number;
  };
  backend: string;
  backend_version: string;
  backend_parameters: any[];
  quantization: string;
  size: number;
}

export interface EvaluateSpec {
  source?: string;
  cluster_id?: number;
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
    gpus_per_replica: number;
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
  cluster_id?: number;
  resource_claim_by_cluster_id?: {
    [key: number]: {
      ram: number;
      vram: number;
    };
  };
}

export interface BackendGroupOption {
  value: string;
  label: string;
  title?: string;
  default_backend_param: string[];
  default_version: string;
  isBuiltIn: boolean;
  versions: { label: string; value: string; title?: string }[];
}

export interface BackendGroupItem {
  value: string;
  label: string;
  title?: string;
  default_backend_param: string[];
  default_version: string;
  isBuiltIn: boolean;
  backend_source: string;
  enabled: boolean;
  versions: {
    label: string;
    value: string;
    title?: string;
    env?: Record<string, any>;
    is_deprecated: boolean;
  }[];
}

export interface BackendOption {
  value: string;
  label: string;
  title?: string;
  default_backend_param: string[];
  default_version: string;
  isBuiltIn: boolean;
  backend_source: string;
  default_env?: Record<string, any>;
  enabled: boolean;
  versions: {
    label: string;
    value: string;
    title?: string;
    env?: Record<string, any>;
    is_deprecated: boolean;
  }[];
}

export interface AccessControlFormData {
  access_policy: 'public' | 'authed' | 'allowed_users';
  users: { id: number }[];
}

export interface BackendItem {
  backend_name: string;
  from_config: boolean;
  default_version: string;
  default_backend_param: string[];
  is_built_in: boolean;
  backend_source: string;
  enabled: boolean;
  versions: {
    version: string;
    env?: Record<string, any>;
    is_deprecated: boolean;
  }[];
}

export interface DraftModelItem {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_model_id: string;
  model_scope_file_path: string;
  local_path: string;
  name: string;
  algorithm: string;
}
