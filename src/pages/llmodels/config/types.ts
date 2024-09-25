export interface ListItem {
  source: string;
  huggingface_repo_id: string;
  huggingface_file_name: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_file_path: string;
  model_scope_model_id: string;
  embedding_only?: boolean;
  ready_replicas: number;
  replicas: number;
  s3Address: string;
  name: string;
  description: string;
  id: number;
  created_at: string;
  updated_at: string;
  gpu_selector?: {
    worker_name: string;
    gpu_index: number;
    gpu_name: string;
  };
  worker_selector?: object;
}

export interface FormData {
  backend?: string;
  backend_parameters?: string[];
  source: string;
  repo_id: string;
  file_name: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  s3_address: string;
  ollama_library_model_name: string;
  distributed_inference_across_workers?: boolean;
  model_scope_model_id?: string;
  model_scope_file_path?: string;
  gpu_selector?: {
    worker_name: string;
    gpu_index: number;
    gpu_name: string;
  };
  placement_strategy?: string;
  cpu_offloading?: boolean;
  worker_selector?: object;
  scheduleType?: string;
  name: string;
  replicas: number;
  description: string;
}

export interface ModelInstanceListItem {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  distributed_servers?: {
    rpc_servers: any[];
  };
  computed_resource_claim?: {
    offload_layers: number;
    total_layers: number;
  };
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
