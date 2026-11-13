import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import type { MonitoringCapabilities } from '@/pages/llmodels/detail/config/types';
import { scopeTimeParams } from '@/pages/llmodels/detail/utils/time-range';
import { request } from '@umijs/max';
import type {
  ResourceDetail,
  ResourceMetrics,
  ResourceTarget,
  TimeScope
} from '../config/types';
import { targetParams, targetPath } from '../utils/navigation';

export const queryResourceDetail = (
  target: ResourceTarget,
  signal: AbortSignal
) =>
  request<ResourceDetail>(`${targetPath(target)}/detail`, {
    method: 'GET',
    params: targetParams(target),
    signal,
    skipErrorHandler: true
  });
export const queryHardwareMetrics = async (
  target: ResourceTarget,
  scope: TimeScope,
  signal: AbortSignal
) => {
  const result = await request<ResourceMetrics>(
    `${targetPath(target)}/metrics`,
    {
      method: 'GET',
      params: { ...targetParams(target), ...scopeTimeParams(scope) },
      signal,
      skipErrorHandler: true
    }
  );
  if (
    scope.start != null &&
    (result.start !== scope.start || result.end !== scope.end)
  )
    throw new Error('Backend did not honor the fixed monitoring range');
  return result;
};
export const queryResourceCapabilities = (
  target: ResourceTarget,
  signal: AbortSignal
) =>
  request<MonitoringCapabilities>(
    `${targetPath(target)}/monitoring-capabilities`,
    {
      method: 'GET',
      signal,
      skipErrorHandler: true
    }
  );
export const resourceGrafanaHref = (
  target: ResourceTarget,
  scope: TimeScope
) => {
  const params = new URLSearchParams();
  Object.entries({
    ...targetParams(target),
    ...scopeTimeParams(scope)
  }).forEach(([key, value]) => params.set(key, String(value)));
  return `/${GPUSTACK_API_BASE_URL}${targetPath(target)}/monitoring-dashboard?${params}`;
};
