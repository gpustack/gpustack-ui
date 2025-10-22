import { ProviderType } from '.';

export interface CredentialFormData {
  name: string;
  provider: string;
  key: string;
  secret: string;
  description?: string;
  id?: number;
}

export type ClusterStatusType = 'provisioning' | 'provisioned' | 'ready';

export interface CredentialListItem {
  id: number;
  name: string;
  provider: ProviderType;
  access_key: string;
  secret_key: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface NodePoolFormData {
  name: string;
  instance_type: string;
  os_image: string;
  image_name: string;
  replicas: number;
  batch_size: number;
  labels: Record<string, string>;
  cloud_options: Record<string, any>;
  instance_spec: Record<string, any>;
}

export interface NodePoolListItem extends NodePoolFormData {
  id: number;
  instance_type: string;
  replicas: number;
  workers: number;
  ready_workers?: number;
  batch_size: number;
  labels: Record<string, string>;
  cloud_options: Record<string, any>;
  os_image: string;
  created_at: string;
  updated_at: string;
  cluster_id: number;
}

export interface ClusterListItem {
  name: string;
  display_name: string;
  description: string;
  provider: ProviderType;
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

export interface ClusterFormData {
  name: string;
  description: string;
  provider: ProviderType;
  credential_id: number;
  zone: string;
  region: string;
  worker_pools?: NodePoolFormData[];
}
