export type ServiceMode = 'managed' | 'external';

export type ServiceState =
  | 'pending'
  | 'starting'
  | 'running'
  | 'error'
  | 'unreachable';

export interface CacheProviderVersionConfig {
  image: string;
  // images keyed by accelerator backend then runtime version; also the
  // support matrix — a worker whose accelerator has no entry cannot run
  // this version (accelerator-less workers run the plain image)
  runtime_images?: Record<string, Record<string, string>>;
  run_command?: string;
  env?: Record<string, string>;
}

export interface CacheProviderL2Field {
  // provider-defined technical key; humanized as the label fallback
  name: string;
  label?: string;
  type?: 'string' | 'number' | 'boolean' | 'password';
  required?: boolean;
  default?: any;
  env_name?: string;
}

export interface CacheProviderL2Backend {
  display_name?: string;
  description?: string;
  icon?: string;
  fields: CacheProviderL2Field[];
}

// external-mode connection parameter the user fills at registration
// (e.g. Mooncake's metadata_server, protocol); rendered into the
// connector injection server-side
export interface CacheProviderExternalField {
  name: string;
  label?: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'password';
  required?: boolean;
  default?: any;
  // when set, the field is a fixed choice (e.g. protocol tcp/rdma)
  options?: string[];
}

// brand link (docs, homepage) shown on the provider card
export interface CacheProviderLink {
  label: string;
  url: string;
}

// managed-mode configuration value promoted to a structured advanced
// field; it adds a {{name}} template placeholder and the provider's
// run-command/env templates decide where the value lands (free-form
// parameters still override any flag they produce)
export interface CacheProviderField {
  name: string;
  label?: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean';
  default?: any;
  options?: string[];
  // numeric bounds and stepper increment for number-typed fields
  min?: number;
  max?: number;
  step?: number;
}

export interface CacheProviderItem {
  name: string;
  display_name: string;
  source: 'built_in' | 'community' | 'partner';
  description?: string;
  icon?: string;
  links?: CacheProviderLink[];
  supported_modes: ServiceMode[];
  // managed-mode instance layout: "singleton" runs one instance on the
  // worker picked at creation; "per_node" runs one on every worker
  topology?: 'singleton' | 'per_node';
  default_version?: string;
  // managed services may pick the reserved "custom" version and supply
  // their own container image via config.image
  custom_version?: boolean;
  versions: Record<string, CacheProviderVersionConfig>;
  // per-inference-backend attach declarations; an entry may be scoped
  // to accelerator frameworks (runtime_images key vocabulary), and
  // unscoped entries serve every other framework
  inference_backend_integrations: {
    backend: string;
    frameworks?: string[];
    versions?: string;
  }[];
  health_check?: Record<string, any>;
  resource_profile?: Record<string, any>;
  // present when the provider supports spilling KV cache to L2 storage
  l2_adapter_flag?: string;
  common_parameters?: string[];
  l2_backends?: Record<string, CacheProviderL2Backend>;
  // external-mode connection parameters, shown on the registration form
  external_fields?: CacheProviderExternalField[];
  // structured configuration fields shown on the managed form, wired
  // into the runtime config via their {{name}} template placeholders
  managed_fields?: CacheProviderField[];
  // where the service's Prometheus exposition is scraped; default_port
  // seeds the registration form's metrics-port field for external
  // providers
  metrics?: {
    path?: string;
    default_port?: number;
    [key: string]: any;
  };
}

export interface L2StorageConfig {
  backend: string;
  params: Record<string, any>;
}

export interface ServiceEndpoint {
  host?: string;
  port?: number;
  url?: string;
  metrics_port?: number;
  metrics_url?: string;
  // values for the provider's declared external_fields, keyed by
  // field name
  params?: Record<string, any>;
}

export interface ServiceConfig {
  ram_size?: number;
  chunk_size?: number;
  // container image ref; required with (and only allowed for) the
  // reserved "custom" provider_version
  image?: string;
  // extra CLI flags passed to the provider container, e.g. "--max-workers=8"
  parameters?: string[];
  env?: Record<string, string>;
  // values for the provider's declared managed_fields, keyed by field name
  fields?: Record<string, any>;
  // managed only; ordered by priority (reads prefer the first entry,
  // writes go to all); null or empty clears the L2 storage backends
  l2_storages?: L2StorageConfig[] | null;
}

export interface FormData {
  name: string;
  provider_name: string;
  provider_version?: string;
  mode: ServiceMode;
  cluster_id: number;
  worker_id?: number;
  // managed per_node topology only; instances run on workers matching
  // ALL label pairs; empty or absent covers every cluster worker
  worker_selector?: Record<string, string> | null;
  restart_on_error?: boolean;
  config?: {
    ram_size?: number;
    chunk_size?: number;
    // container image ref; required with (and only allowed for) the
    // reserved "custom" provider_version
    image?: string;
    parameters?: string[];
    env?: Record<string, string>;
    fields?: Record<string, any>;
    l2_storages?: L2StorageConfig[] | null;
  };
  endpoint?: {
    host?: string;
    port: number;
    metrics_port?: number;
    // values for the provider's declared external_fields
    params?: Record<string, any>;
  };
}

export interface ListItem {
  id: number;
  name: string;
  provider_name: string;
  provider_version?: string;
  mode: ServiceMode;
  cluster_id: number;
  // managed singleton topology only; per-instance placement lives in
  // CacheServiceInstanceItem
  worker_id?: number;
  // managed per_node topology only; instances run on workers matching
  // ALL label pairs; empty or absent covers every cluster worker
  worker_selector?: Record<string, string> | null;
  config?: ServiceConfig;
  endpoint?: ServiceEndpoint;
  // managed services aggregate their instances' states; state_message
  // carries the roll-up (e.g. "2/3 instances running")
  state: ServiceState;
  state_message?: string;
  restart_on_error?: boolean;
  healthy?: boolean;
  last_check_at?: string;
  created_at: string;
  updated_at: string;
}

// one managed cache server process on a specific worker
export interface CacheServiceInstanceItem {
  id: number;
  // service-name-prefixed, e.g. "my-cache-x1y2z"
  name: string;
  cache_service_id: number;
  worker_id: number;
  cluster_id: number;
  port?: number;
  metrics_port?: number;
  state: ServiceState;
  state_message?: string;
  healthy?: boolean;
  last_check_at?: string;
  restart_count?: number;
  last_restart_time?: string;
  created_at: string;
  updated_at: string;
}

export interface MetricPoint {
  timestamp: number;
  // null marks a non-finite sample (e.g. an idle 0/0 ratio) — a chart gap
  value: number | null;
}

// one chartable series of a semantic metric; labels identify the
// instance (worker) the series belongs to
export interface CacheServiceMetricSeries {
  labels: Record<string, string>;
  points: [number, number | null][];
}

// one semantic metric at two granularities: the service-level
// aggregate (traffic-weighted, readable at any fleet size) and the
// per-instance breakdown behind a toggle
export interface CacheServiceMetricChart {
  aggregate: CacheServiceMetricSeries[];
  instances: CacheServiceMetricSeries[];
}

// external-cache hit accounting of one attached engine instance over
// the requested window; the row set is database-backed, so an engine
// without the counters keeps its row with null accounting fields
export interface CacheServiceAttachedMetrics {
  model_id?: number | null;
  model_name?: string | null;
  model_instance_name?: string | null;
  worker_name?: string | null;
  hit_tokens?: number | null;
  queried_tokens?: number | null;
  hit_rate?: number | null;
}

// semantic series translated server-side from the provider's declared
// metric mappings; available=false carries why charts cannot render
export interface CacheServiceMetricsData {
  available: boolean;
  reason?: string;
  mappings: Record<string, CacheServiceMetricChart>;
  throughput: Record<string, CacheServiceMetricChart>;
  attached: CacheServiceAttachedMetrics[];
}

export interface CacheServiceModelItem {
  id: number;
  name: string;
  replicas: number;
  backend: string;
}
