export interface FormData {
  name: string;
  description: string;
  categories: any[];
  meta: Record<string, any>;
  generic_proxy: boolean;
  fallback_target: {
    provider_model_name?: string;
    model_id?: number;
    provider_id?: number;
    fallback_status_codes?: string[];
  };
  targets: {
    provider_model_name?: string;
    weight?: number | null;
    model_id?: number;
    provider_id?: number;
    fallback_status_codes?: string[];
  }[];
}

export interface RouteItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  description: string;
  categories: string[];
  meta: Record<string, any>;
  created_by_model: boolean;
  targets: number;
  ready_targets: number;
  access_policy: string;
}

export interface RouteTarget {
  id: number;
  created_at: string;
  updated_at: string;
  weight: number;
  model_id: number;
  name: string;
  route_name: string;
  route_id: number;
  provider_id: number;
  provider_model_name: string;
  fallback_status_codes: string[];
  state: string;
}
