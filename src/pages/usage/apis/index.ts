import { request } from '@umijs/max';
import {
  BreakdownItem,
  FilterOptionType,
  TimeSeriesData,
  UsageMeta
} from '../config/types';

export const USAGE_META = '/usage/meta';
export const USAGE_TIMESERIES = '/usage/timeseries';
export const USAGE_BREAKDOWN = '/usage/breakdown';

export const MODEL_ROUTE_TARGETS = '/model-route-targets';

export async function queryUsageMetaData(
  params: Record<string, any>,
  options?: any
): Promise<UsageMeta> {
  return request<UsageMeta>(USAGE_META, {
    params,
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function queryUsageTimeSeriesData(
  params: {
    start_date: string;
    end_date: string;
    scope: string;
    metric: string;
    group_by: string;
    granularity: string;
    filters: {
      models?: FilterOptionType[];
      users?: FilterOptionType[];
      api_keys?: FilterOptionType[];
    };
  },
  options?: any
): Promise<TimeSeriesData> {
  return request<TimeSeriesData>(USAGE_TIMESERIES, {
    data: params,
    method: 'POST',
    cancelToken: options?.token
  });
}

export async function queryUsageBreakdownList(
  params: Global.SearchParams & {
    filters: {
      models?: FilterOptionType[];
      users?: FilterOptionType[];
      api_keys?: FilterOptionType[];
    };
  },
  options?: any
) {
  return request<Global.PageResponse<BreakdownItem>>(USAGE_BREAKDOWN, {
    data: params,
    method: 'POST',
    cancelToken: options?.token
  });
}
