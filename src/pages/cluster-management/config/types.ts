export interface FormData {
  name: string;
  provider: string;
  access_key: string;
  secret_key: string;
  description?: string;
  id?: number;
}

export interface ListItem {
  id: number;
  name: string;
  provider: string;
  access_key: string;
  secret_key: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ClusterListItem {
  name: string;
  provider: string;
  workers: number;
  created_at: string;
  gpus: number;
  deployments: number;
  id: number;
}

export interface ClusterFormData {
  name: string;
  provider: string;
  credential: string;
  region: string;
  workers: number;
  gpuPlan: string;
  description?: string;
  id?: number;
}
