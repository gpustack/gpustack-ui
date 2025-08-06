export interface CredentialFormData {
  name: string;
  provider: string;
  access_key: string;
  secret_key: string;
  description?: string;
  id?: number;
}

export interface CredentialListItem {
  id: number;
  name: string;
  provider: string;
  access_key: string;
  secret_key: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ClusterFormData {
  display_name: string;
  description: string;
  provider: string;
  credential_id: number;
  zone: string;
  region: string;
}

export interface NodePoolListItem {
  id: number;
  instance_type: string;
  replicas: number;
  batch_size: number;
  labels: Record<string, string>;
  cloud_options: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NodePoolFormData {
  instance_type: string;
  replicas: number;
  batch_size: number;
  labels: Record<string, string>;
  cloud_options: Record<string, any>;
}

export interface ClusterListItem {
  name: string;
  display_name: string;
  description: string;
  provider: string;
  credential_id: number;
  zone: string;
  region: string;
  gpus: number;
  deployments: number;
  id: number;
  status: string;
  state_message: string;
  worker_pools: NodePoolListItem[];
}
