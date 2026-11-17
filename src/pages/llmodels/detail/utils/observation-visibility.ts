import type { ModelMetric } from '../config/types';
import type { PDCacheFeatures } from './pd-cache-features';
import { pdObservationGroups } from './pd-metrics';

const standard = {
  llm: [
    'ttft',
    'tpot',
    'itl',
    'input_tokens',
    'output_tokens',
    'running_requests',
    'waiting_requests'
  ],
  stages: ['e2e', 'queue', 'prefill', 'decode'],
  cache: ['kv_usage', 'prefix_cache_hit_rate', 'external_cache_hit_rate'],
  gpu: [
    'gpu_utilization',
    'gpu_memory_used',
    'gpu_memory_total',
    'gpu_power',
    'gpu_temperature'
  ],
  host: ['host_cpu', 'host_memory_used', 'host_memory_total']
};

export const monitoringObservationGroups = (
  metrics: Record<string, ModelMetric>,
  pd: boolean,
  backend?: string,
  cacheFeatures?: PDCacheFeatures
): Record<string, string[]> =>
  pd
    ? {
        ...pdObservationGroups(metrics, backend, cacheFeatures),
        gpu: standard.gpu,
        host: standard.host
      }
    : {
        ...standard,
        ...(metrics.ingress_ttft || metrics.ingress_e2e
          ? { service: ['ingress_ttft', 'ingress_e2e'] }
          : {})
      };
