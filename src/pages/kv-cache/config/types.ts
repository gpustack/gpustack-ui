import type { LocalizedText } from '@/utils/localize';

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
  label?: LocalizedText;
  // what the value does, for a knob the label alone does not explain
  description?: LocalizedText;
  type?: 'string' | 'number' | 'boolean' | 'password';
  required?: boolean;
  default?: any;
  env_name?: string;
}

export interface CacheProviderL2Backend {
  display_name?: LocalizedText;
  description?: LocalizedText;
  icon?: string;
  // when set, configuring this backend is optional: the form offers a
  // switch, and the declared fields only apply while it is on
  adapter_flag_optional?: boolean;
  adapter_flag_default?: boolean;
  adapter_flag_label?: LocalizedText;
  fields: CacheProviderL2Field[];
}

// brand link (docs, homepage) shown on the provider card
export interface CacheProviderLink {
  label: LocalizedText;
  url: string;
}

// managed-mode configuration value promoted to a structured advanced
// field; it adds a {{name}} template placeholder and the provider's
// run-command/env templates decide where the value lands (free-form
// parameters still override any flag they produce)
export interface CacheProviderField {
  name: string;
  label?: LocalizedText;
  description?: LocalizedText;
  // sample value shown in the empty input
  placeholder?: string;
  type?: 'string' | 'number' | 'boolean';
  default?: any;
  // the form requires a value (a declared default satisfies it)
  required?: boolean;
  // default per accelerator framework of the cluster's workers, falling
  // back to `default` (e.g. Ascend transport on NPU nodes)
  framework_defaults?: Record<string, any>;
  // a choice is the stored value, or {value, label, description} when
  // the display text differs (description renders under the label in
  // the dropdown)
  options?: (
    | string
    | { value: string; label?: LocalizedText; description?: LocalizedText }
  )[];
  // renders only while the visible_by field equals visible_when (a
  // hidden field's default still renders server-side)
  visible_by?: string;
  visible_when?: any;
  // numeric bounds and stepper increment for number-typed fields
  min?: number;
  max?: number;
  step?: number;
}

// one role of a multi-component provider: how its instances are placed,
// what turns it on, and what it binds
export interface CacheProviderComponent {
  topology?: string;
  replicas?: number;
  replicas_by?: string;
  depends_on?: string;
  enabled_by?: string;
  enabled_when?: any;
  attach_endpoint?: boolean;
  // every port the component binds, and which of them carries its
  // address and its Prometheus exposition
  ports?: (
    | string
    | { name: string; enabled_by?: string; enabled_when?: any }
  )[];
  address_port?: string;
  metrics_port?: string;
  // completion hints for this role's own binary; the provider-level
  // list describes the one engines attach to
  common_parameters?: string[];
  // a bare boolean, or a gate following a declared field for a
  // component that needs a device only under some configurations
  gpu_access?: boolean | { enabled_by: string; enabled_when?: any };
  resource_profile?: CacheProviderResourceProfile;
}

export interface CacheProviderItem {
  name: string;
  display_name: LocalizedText;
  source: 'built_in' | 'community' | 'partner';
  description?: LocalizedText;
  icon?: string;
  links?: CacheProviderLink[];
  // why this installation cannot run the provider, which is also what
  // marks it unavailable: the card is listed so the choice stays
  // visible, but it cannot be picked
  unavailable_reason?: LocalizedText;
  // the engine ships its own management UI: the form offers management_url
  management_url?: boolean;
  // managed-mode instance layout of single-component providers:
  // "replicas" runs a scheduler-placed instance (optionally pinned to a
  // picked worker); "per_node" runs one on every matching worker
  topology?: 'replicas' | 'per_node';
  // multi-component providers (a master and its stores, say) declare
  // per-role layout; a component's resource_profile states one
  // instance's RAM claim for the placement pre-flight
  components?: Record<string, CacheProviderComponent>;
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
  resource_profile?: CacheProviderResourceProfile;
  // present when the provider supports spilling KV cache to L2 storage
  l2_adapter_flag?: string;
  common_parameters?: string[];
  l2_backends?: Record<string, CacheProviderL2Backend>;
  // structured configuration fields shown on the form, wired
  // into the runtime config via their {{name}} template placeholders
  fields?: CacheProviderField[];
  // the all-version default of where the service's Prometheus
  // exposition is scraped (a version may override it server-side)
  default_metrics?: {
    path?: string;
    [key: string]: any;
  };
}

export interface L2StorageConfig {
  backend: string;
  params: Record<string, any>;
  // state of the backend's optional-configuration switch; absent for
  // backends that declare none
  adapter_flag_enabled?: boolean;
}

// ram_gib is a template over the declared field values (e.g.
// "{{ram_size}}"); rendering it yields one instance's RAM claim
export interface CacheProviderResourceProfile {
  ram_gib?: string;
  cpu?: number;
}

export interface ServiceConfig {
  // container image ref; required with (and only allowed for) the
  // reserved "custom" provider_version
  image?: string;
  // extra CLI flags passed to the provider container, e.g.
  // "--max-workers=8", keyed by the component whose launch command takes
  // them ("" for a provider that runs a single process)
  parameters?: Record<string, string[]>;
  env?: Record<string, string>;
  // values for the provider's declared fields, keyed by field name
  fields?: Record<string, any>;
  // managed only; ordered by priority (reads prefer the first entry,
  // writes go to all); null or empty clears the L2 storage backends
  l2_storages?: L2StorageConfig[] | null;
  // link to the cache engine's own management console (display-only)
  management_url?: string;
}

export interface FormData {
  name: string;
  provider_name: string;
  provider_version?: string;
  cluster_id: number;
  worker_id?: number;
  // per_node topology only; instances run on workers matching
  // ALL label pairs; empty or absent covers every cluster worker
  worker_selector?: Record<string, string> | null;
  restart_on_error?: boolean;
  config?: {
    // container image ref; required with (and only allowed for) the
    // reserved "custom" provider_version
    image?: string;
    parameters?: Record<string, string[]>;
    env?: Record<string, string>;
    fields?: Record<string, any>;
    l2_storages?: L2StorageConfig[] | null;
    // link to the cache engine's own management console (display-only)
    management_url?: string;
  };
}

export interface ListItem {
  id: number;
  name: string;
  provider_name: string;
  provider_version?: string;
  cluster_id: number;
  // replicas topology only; per-instance placement lives in
  // CacheServiceInstanceItem
  worker_id?: number;
  // per_node topology only; instances run on workers matching
  // ALL label pairs; empty or absent covers every cluster worker
  worker_selector?: Record<string, string> | null;
  config?: ServiceConfig;
  // a service aggregates its instances' states; state_message
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
  // which provider component this instance runs (e.g. "master"); empty
  // for single-component providers
  component?: string;
  cluster_id: number;
  // every port the instance holds, keyed by the name its component gave
  // it; `port` is the one the instance is addressed by
  ports?: Record<string, number>;
  port?: number;
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
