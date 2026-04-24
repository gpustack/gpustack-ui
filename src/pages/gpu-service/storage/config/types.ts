export interface FormData {
  name: string;
  description?: string;
  type?: string;
  capacity_gb?: number;
  mount_path?: string;
  access_modes?: string[];
  parameters?: Record<string, any>;
  status?: string;
  cluster_id?: number;
}

export interface ListItem extends FormData {
  id: number;
  created_at?: string;
  updated_at?: string;
}
