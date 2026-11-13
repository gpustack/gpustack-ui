export type Statistic = 'avg' | 'p50' | 'p95' | 'p99' | 'rate' | 'current';
export type MetricStatus =
  | 'available'
  | 'no_data'
  | 'no_observations'
  | 'unsupported'
  | 'not_applicable'
  | 'query_error'
  | 'restricted'
  | 'stale';
export interface Dimensions {
  role?: string;
  model_instance_id?: number;
  model_instance_name?: string;
  source_name?: string;
  endpoint_dp_rank?: string;
  dp_rank?: string;
  worker_id?: number;
  device_id?: string;
  mount_point?: string;
  upstream_instance_id?: number;
}
export interface MetricSeries {
  // Client-side composition identity; never sent as a monitoring query.
  compositionKey?: string;
  name: string;
  statistic: Statistic;
  dimensions: Dimensions;
  points: [number, number | null][];
}
export interface MetricSummary {
  statistic: Statistic;
  dimensions: Dimensions;
  value: number | null;
  sample_count?: number | null;
}
export interface ModelMetric {
  kind: 'histogram' | 'counter' | 'gauge';
  unit: string;
  measurement_scope: string;
  status: MetricStatus;
  reason: string | null;
  supported_statistics: Statistic[];
  series: MetricSeries[];
  summaries: MetricSummary[];
  coverage?: {
    expected_instances: number;
    observed_instances: number;
    partial: boolean;
  };
}
// UI composition metadata; never added to the server request/response contract.
export interface MetricComponentWarning {
  label: string;
  status: MetricStatus;
  reason: string | null;
}
export type MetricView = ModelMetric & {
  componentWarnings?: MetricComponentWarning[];
};

interface MetricsResponse {
  model_id: number;
  available: boolean;
  reason: string | null;
  start: number;
  end: number;
  step: number;
  last_refreshed_at: number;
  history_scope: string;
  metrics: Record<string, ModelMetric>;
}
export interface ModelMetrics extends MetricsResponse {
  source: 'engine';
  rate_window_seconds: number;
}
export interface MonitoringCapabilities {
  min_query_seconds: number;
  max_query_seconds: number;
  retention_seconds: number | null;
  retention_size_based: boolean;
  retention_known: boolean;
  retention_source: 'prometheus_runtimeinfo' | 'prometheus_flags' | 'unknown';
  supports_custom_range: boolean;
}
export interface ResourceDevice {
  id: string;
  worker_id: number;
  worker_name: string;
  name: string;
  index: number;
  chip_index?: number | null;
  scope: 'physical_gpu' | 'partition';
  model_instance_ids: number[];
  current?: Record<string, number | null>;
  last_reported_at?: number | null;
  history_available: boolean;
  reason: string | null;
}
export interface ModelResourceMetrics extends MetricsResponse {
  source: 'hardware';
  allocated_gpu_count: number;
  allocated_worker_count: number;
  devices: ResourceDevice[];
  workers?: { id: number; name: string }[];
  all_devices?: boolean;
  selected_device_id: string | null;
}
export interface MonitoringScope {
  latencyMetric: 'tpot' | 'itl';
  window: string;
  start?: number;
  end?: number;
  instanceIds: number[];
  role: 'all' | 'prefill' | 'decode' | 'router';
  view: 'aggregate' | 'instances';
  deviceId?: string;
}
export type DetailTab =
  | 'overview'
  | 'monitoring'
  | 'instances'
  | 'gpu'
  | 'configuration';
