export interface FormData {
  name: string;
  description?: string;
  image?: string;
  instance_type?: string;
  instance_type_id?: number;
  template_id?: number;
  gpu_count?: number;
  replicas?: number;
  storage_mode?: string;
  storage_id?: number;
  local_storage_size_gb?: number;
  cluster_id?: number;
  mount_path?: string;
}

export interface ListItem extends FormData {
  id: number;
  status?: string;
  endpoint?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InstanceItem {
  id: number;
  name: string;
  vram: number; // GiB
  ram: number; // GiB
  vCPU: number; // cores
  gpu_count: number;
  status: string; // available, unavailable
}
