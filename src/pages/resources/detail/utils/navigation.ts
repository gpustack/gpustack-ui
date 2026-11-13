import { FALLBACK_MONITORING_CAPABILITIES } from '@/pages/llmodels/detail/config';
import {
  scopeTimeParams,
  validateTimeRange
} from '@/pages/llmodels/detail/utils/time-range';
import type { ResourceTab, ResourceTarget, TimeScope } from '../config/types';

export const timeScopeFromParams = (params: URLSearchParams): TimeScope => {
  const start = params.has('start') ? Number(params.get('start')) : undefined;
  const end = params.has('end') ? Number(params.get('end')) : undefined;
  if (start != null || end != null) {
    if (!validateTimeRange(start, end, FALLBACK_MONITORING_CAPABILITIES))
      return { window: '1h', start, end };
  }
  const window = params.get('window') || '1h';
  return {
    window: /^(5m|15m|30m|1h|3h|6h|12h|24h|2d|7d)$/.test(window) ? window : '1h'
  };
};
export const targetPath = (target: ResourceTarget) =>
  `/${target.kind === 'gpu' && !target.deviceId ? 'gpu-devices' : 'workers'}/${encodeURIComponent(target.id)}`;
export const targetParams = (target: ResourceTarget) =>
  target.deviceId ? { device_id: target.deviceId } : {};
export const resourceHref = (
  target: ResourceTarget,
  scope?: TimeScope,
  tab?: ResourceTab
) => {
  const params = new URLSearchParams();
  params.set(target.deviceId ? 'worker_id' : 'id', target.id);
  if (target.deviceId) params.set('device_id', target.deviceId);
  if (scope)
    Object.entries(scopeTimeParams(scope)).forEach(([key, value]) =>
      params.set(key, String(value))
    );
  if (tab && tab !== 'overview') params.set('tab', tab);
  return `#/resources/${target.kind === 'gpu' ? 'gpus' : 'workers'}/detail?${params}`;
};
