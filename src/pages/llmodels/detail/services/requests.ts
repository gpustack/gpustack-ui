import { request } from '@umijs/max';
import { FALLBACK_MONITORING_CAPABILITIES } from '../config';
import type {
  ModelMetrics,
  ModelResourceMetrics,
  MonitoringCapabilities,
  MonitoringScope
} from '../config/types';
import { scopeTimeParams } from '../utils/time-range';
export const runtimeParams = (scope: MonitoringScope) => ({
  ...scopeTimeParams(scope),
  instance_ids: scope.instanceIds.length
    ? scope.instanceIds.join(',')
    : undefined,
  role: scope.role,
  view: scope.view,
  statistic: 'avg,p50,p95,p99',
  section: 'all'
});
export const resourceParams = (scope: MonitoringScope) => ({
  ...scopeTimeParams(scope),
  instance_ids: scope.instanceIds.length
    ? scope.instanceIds.join(',')
    : undefined,
  role: scope.role,
  all_devices: true
});
export const queryRuntimeMetrics = (
  id: number,
  scope: MonitoringScope,
  signal: AbortSignal
) =>
  checkedRange(
    request<ModelMetrics>(`/models/${id}/metrics`, {
      method: 'GET',
      params: runtimeParams(scope),
      signal,
      skipErrorHandler: true
    }),
    scope
  );
export const queryResourceMetrics = (
  id: number,
  scope: MonitoringScope,
  signal: AbortSignal
) =>
  checkedRange(
    request<ModelResourceMetrics>(`/models/${id}/resource-metrics`, {
      method: 'GET',
      params: resourceParams(scope),
      signal,
      skipErrorHandler: true
    }),
    scope
  );

const checkedRange = async <T extends { start: number; end: number }>(
  response: Promise<T>,
  scope: MonitoringScope
): Promise<T> => {
  const result = await response;
  if (
    scope.start != null &&
    (result.start !== scope.start || result.end !== scope.end)
  ) {
    throw new Error(
      'The backend did not honor the fixed monitoring time range'
    );
  }
  return result;
};

export const queryMonitoringCapabilities = async (
  id: number,
  signal: AbortSignal
) => {
  try {
    return await request<MonitoringCapabilities>(
      `/models/${id}/monitoring-capabilities`,
      {
        method: 'GET',
        signal,
        skipErrorHandler: true
      }
    );
  } catch (error: any) {
    if ([404, 405, 501].includes(error?.response?.status))
      return { ...FALLBACK_MONITORING_CAPABILITIES };
    throw error;
  }
};
