import type {
  ModelMetric,
  ResourceDevice
} from '@/pages/llmodels/detail/config/types';
import type { ListItem } from '../../config/types';

export type ResourceTarget = {
  kind: 'worker' | 'gpu';
  id: string;
  deviceId?: string;
};
export type ResourceTab =
  | 'overview'
  | 'monitoring'
  | 'instances'
  | 'configuration';
export interface TimeScope {
  window: string;
  start?: number;
  end?: number;
}
export interface ResourcePlacement {
  worker_id: number;
  worker_name: string;
  worker_ip?: string | null;
  gpu_indexes: number[];
  is_main: boolean;
}
export interface ResourceAssociation {
  id: number;
  name: string;
  model_id: number;
  model_name: string;
  state: string;
  state_message?: string | null;
  role?: string | null;
  backend?: string | null;
  backend_version?: string | null;
  gpu_device_ids: string[];
  spans_workers: boolean;
  placements?: ResourcePlacement[];
  placements_complete?: boolean;
}
export interface ResourceDetail {
  worker: ListItem;
  can_edit: boolean;
  cluster_name: string | null;
  selected_device_id: string | null;
  devices: ResourceDevice[];
  instances: ResourceAssociation[];
}
export interface ResourceMetrics {
  worker_id: number;
  selected_device_id: string | null;
  source: 'hardware';
  available: boolean;
  reason: string | null;
  start: number;
  end: number;
  step: number;
  last_refreshed_at: number;
  history_scope: string;
  devices: ResourceDevice[];
  metrics: Record<string, ModelMetric>;
}
