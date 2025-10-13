export interface ListItem {
  name: string;
  description: string;
  id: number;
  value: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  allowed_model_names: string[];
}

export interface FormData {
  name: string;
  allowed_type: 'all' | 'custom';
  description: string;
  allowed_model_names: string[];
  expires_in: number | null;
}
