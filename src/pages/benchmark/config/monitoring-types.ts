import type {
  Dimensions,
  ModelMetrics,
  ModelResourceMetrics,
  MonitoringCapabilities,
  ResourceDevice
} from '@/pages/llmodels/detail/config/types';

export interface BenchmarkTimeRange {
  start: number;
  end: number;
}

export interface BenchmarkObservationStorage {
  source: 'live' | 'archive';
  run_id: string;
  content_version?: string | null;
  compressed_bytes?: number | null;
  retryable?: boolean;
  sealed?: boolean;
  archive_state: string;
  capture_complete: boolean;
  data_coverage?: string | null;
  captured_until?: number | null;
  expires_at?: number | null;
  last_error?: string | null;
}

export interface BenchmarkQueryCapabilities {
  run_replay: boolean;
  phase_replay: boolean;
  custom_range_trends: boolean;
  custom_range_summary: boolean;
  arbitrary_subset_summary: boolean;
}

export interface BenchmarkObservationMetadata {
  observation_storage?: BenchmarkObservationStorage | null;
  query_capabilities?: BenchmarkQueryCapabilities | null;
}

export interface BenchmarkArchiveStatus {
  run_id: string | null;
  state: string;
  content_version?: string | null;
  compressed_bytes?: number | null;
  retryable: boolean;
  captured_until?: number | null;
  last_error?: string | null;
}
export interface BenchmarkPhase {
  id: string;
  sequence: number;
  input_tokens: number | null;
  rate: number | null;
  measurement_number?: number | null;
  search_phase?: 'expand' | 'refine' | 'manual' | 'single' | 'probe' | null;
  search_phase_source?: 'load_history' | 'configuration' | null;
  start: number | null;
  end: number | null;
  traffic_start: number | null;
  traffic_end: number | null;
  status: string;
  reason: string | null;
}

export interface BenchmarkMonitoring extends BenchmarkObservationMetadata {
  benchmark_id: number;
  model_id: number | null;
  history_scope: 'benchmark_snapshot';
  available: boolean;
  reason: string | null;
  run_window: BenchmarkTimeRange | null;
  stages: BenchmarkPhase[];
  instances: {
    id: number;
    name: string;
    role: string | null;
    worker_id: number | null;
    worker_ids?: number[];
    gpu_indexes: number[];
    current_available?: boolean;
  }[];
  devices: (ResourceDevice & { current_available?: boolean })[];
  workers: { id: number; name: string; current_available?: boolean }[];
  resource_status?: string;
  resource_reason?: string | null;
  events?: {
    kind: 'association_captured' | 'generation_changed';
    at: number;
    model_instance_id?: number | null;
  }[];
  capabilities: MonitoringCapabilities;
}

export interface BenchmarkMonitoringQuery {
  run_id?: string;
  content_version?: string;
  phase_id?: string;
  start?: number;
  end?: number;
  view?: 'aggregate' | 'instances';
  role?: string;
}

export interface BenchmarkMonitoringData {
  context: BenchmarkMonitoring | null;
  runtime: BenchmarkRuntimeMetrics | null;
  instances: BenchmarkRuntimeMetrics | null;
  resources: BenchmarkResourceMetrics | null;
  loading: boolean;
  window: BenchmarkTimeRange | null;
  errors: Partial<
    Record<'context' | 'runtime' | 'instances' | 'resources', unknown>
  >;
}

export interface BenchmarkSampleStatistics {
  dimensions: Dimensions;
  average: number | null;
  peak: number | null;
  peak_at: number | null;
  last: number | null;
  last_at: number | null;
  threshold: number | null;
  threshold_fraction: number | null;
  observed_samples: number;
  expected_samples: number;
  coverage: number;
}
export type BenchmarkRuntimeMetrics = Omit<
  ModelMetrics,
  'model_id' | 'start' | 'end' | 'step' | 'rate_window_seconds'
> &
  BenchmarkObservationMetadata & {
    model_id: number | null;
    start: number | null;
    end: number | null;
    step?: number;
    rate_window_seconds?: number;
    phase_id?: string | null;
    sample_statistics?: Record<string, BenchmarkSampleStatistics[]>;
  };
export type BenchmarkResourceMetrics = Omit<
  ModelResourceMetrics,
  'model_id' | 'start' | 'end' | 'step'
> &
  BenchmarkObservationMetadata & {
    model_id: number | null;
    start: number | null;
    end: number | null;
    step?: number;
    phase_id?: string | null;
    sample_statistics?: Record<string, BenchmarkSampleStatistics[]>;
  };

export interface BenchmarkPhaseObservations {
  run_id?: string | null;
  content_version?: string | null;
  phases: Record<
    string,
    {
      runtime: BenchmarkRuntimeMetrics;
      resources: BenchmarkResourceMetrics | null;
    }
  >;
}
