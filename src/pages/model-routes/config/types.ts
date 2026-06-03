export interface RouteTargetFormItem {
  id?: number;
  overridden_model_name?: string;
  weight?: number | null;
  model_id?: number;
  provider_id?: number;
  fallback_status_codes?: string[];
  parentId?: string | number;
}

export interface FormData {
  name: string;
  description: string;
  categories: any[];
  meta: Record<string, any>;
  generic_proxy: boolean;
  fallback_target: RouteTargetFormItem | null;
  targets: RouteTargetFormItem[];
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
  // Org principal that owns this route. Drives the ``{org}/{name}`` model-id
  // prefix when opening the route in the Playground.
  owner_principal_id?: number;
}

export interface RouteTarget extends RouteTargetFormItem {
  id: number;
  created_at: string;
  updated_at: string;
  weight: number;
  model_id: number;
  name: string;
  route_name: string;
  route_id: number;
  provider_id: number;
  overridden_model_name: string;
  fallback_status_codes: string[];
  state: string;
}
