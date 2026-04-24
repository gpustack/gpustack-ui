export interface FormData {
  name: string;
  description?: string;
  image?: string;
  gpu_count?: number;
  replicas?: number;
}

export interface ListItem extends FormData {
  id: number;
  status?: string;
  endpoint?: string;
  created_at?: string;
  updated_at?: string;
}
