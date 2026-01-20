export interface AccessItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  description: string;
  categories: string[];
  meta: Record<string, any>;
  created_by_model: boolean;
  endpoint_count: number;
}

export interface FormData {
  name: string;
  description: string;
  categories: any[];
  meta: Record<string, any>;
  endpoints: {
    provider_model_name: string;
    weight: number;
    model_id: number;
    provider_id: number;
  }[];
}

export interface AccessPointItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  provider_model_name: string;
  weight: number;
  model_id: number;
  provider_id: number;
  name: string;
  access_id: number;
  state: string;
  fallback_status_codes: string[];
}
