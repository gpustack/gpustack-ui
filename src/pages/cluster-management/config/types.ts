export interface CredentialFormData {
  name: string;
  provider: string;
  key: string;
  secret: string;
  description?: string;
  id?: number;
}

export type ClusterStatusType = 0 | 1 | 3;

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
  name: string;
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
  models: number;
  workers: number;
  ready_workers: number;
  id: number;
  state: ClusterStatusType;
  state_message: string;
  worker_pools: NodePoolListItem[];
}
