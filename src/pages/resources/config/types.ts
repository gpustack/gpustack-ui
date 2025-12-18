export interface Gpu {
  uuid: string;
  name: string;
  vendor: string;
  index: number;
  core: {
    total: number;
    allocated: number;
    utilization_rate: number;
  };
  memory: {
    total: number;
    allocated: number;
    used: number;
    utilization_rate: number;
  };
  temperature: number;
}

export interface GPUDeviceItem {
  uuid: string;
  name: string;
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

export interface Filesystem {
  name: string;
  mount_point: string;
  mount_from: string;
  total: number;
  used: number;
  free: number;
  available: number;
}

export interface Kernel {
  name: string;
  release: string;
  version: string;
  architecture: string;
}

export interface ListItem {
  name: string;
  hostname: string;
  address: string;
  labels: Record<string, string>;
  state: string;
  ip: string;
  cluster_id: number;
  state_message: string;
  ssh_key_id: string;
  advertise_address: string;
  provision_progress: string;
  maintenance: {
    enabled: boolean;
    message: string;
  };
  status: {
    cpu: {
      total: number;
      allocated: number;
      utilization_rate: number;
    };
    memory: {
      total: number;
      used: number;
      allocated: number;
    };
    gpu_devices: GPUDeviceItem[];
    swap: {
      total: number;
      used: number;
    };
    filesystem: Filesystem[];
    os: {
      name: string;
      version: string;
    };
    kernel: Kernel;
    uptime: {
      uptime: number;
      boot_time: string;
    };
  };
  id: number;
  created_at: string;
  updated_at: string;
}

export interface ModelFile {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_model_id: string;
  model_scope_file_path: string;
  local_path: string;
  local_dir: string;
  worker_id: number;
  size: number;
  download_progress: number;
  resolved_paths: string[];
  state: string;
  state_message: string;
  id: number;
  created_at: string;
  updated_at: string;
}

export interface ModelFileFormData {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_model_id: string;
  model_scope_file_path: string;
  local_path: string;
  local_dir: string;
}
