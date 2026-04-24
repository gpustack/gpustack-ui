export interface PortItem {
  protocol: 'udp' | 'tcp';
  value?: number;
}

export interface FormData {
  name: string;
  image?: string;
  vendor?: string;
  image_pull_policy?: string;
  run_command?: string;
  boot_disk_size_gb?: number;
  volume_size_gb?: number;
  volume_mount_path?: string;
  ports?: PortItem[];
  env?: Record<string, any>;
}

export interface ListItem extends FormData {
  id: number;
  description?: string;
  gpu_count?: number;
  replicas?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
