export interface RouteTargetFormItem {
  id?: number;
  overridden_model_name?: string;
  weight?: number | null;
  model_id?: number;
  provider_id?: number;
  fallback_status_codes?: string[];
  parentId?: string | number;
  max_running_requests?: number | null;
}

// Server-derived lb_mode has three rendered states; null (pure round-robin
// or no usable target) shows no badge (API spec §2.1).
export type LbMode = 'weighted' | 'scoring' | 'invalid';

export interface LbHealthConfig {
  fail_open?: boolean;
  unhealthy_threshold?: number;
  cooldown_ms?: number;
  ramp_ms?: number;
}

export interface LbRejectConfig {
  status?: number;
  message?: string;
}

export interface LbRedisConfig {
  service_name: string;
  service_port?: number;
  username?: string;
  password?: string;
  database?: number;
  timeout?: number;
  key_prefix?: string;
}

export interface LbPluginConfig {
  enabled?: boolean;
  health?: LbHealthConfig;
  reject?: LbRejectConfig;
  max_body_bytes?: number;
  redis?: LbRedisConfig;
}

export interface SessionKeyItem {
  header?: string;
  bodyKey?: string;
}

export interface SessionAffinityPluginConfig {
  enabled?: boolean;
  sessionKeys?: SessionKeyItem[];
  enableOnPathSuffix?: string[];
  weight?: number;
}

export interface LeastLoadPluginConfig {
  enabled?: boolean;
  weight?: number;
}

// Route-level plugin namespace. A plugin key set to null means "delete the
// plugin's config" on PUT; absent means "leave untouched".
export interface RoutePlugins {
  lb?: LbPluginConfig | null;
  'session-affinity'?: SessionAffinityPluginConfig | null;
  'least-load'?: LeastLoadPluginConfig | null;
}

export interface FormData {
  name: string;
  description: string;
  categories: any[];
  meta: Record<string, any>;
  generic_proxy: boolean;
  fallback_target: RouteTargetFormItem | null;
  targets: RouteTargetFormItem[];
  plugins?: RoutePlugins;
  // Form-only field, stripped before submit.
  lb_policy_mode?: string;
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
  // Derived by the server from the targets' weights and enabled plugins.
  lb_mode?: LbMode | null;
  // Only present on the detail endpoint (GET /model-routes/{id}).
  plugins?: RoutePlugins;
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
