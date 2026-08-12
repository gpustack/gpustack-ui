import { request } from '@umijs/max';
import {
  BreakdownItem,
  FilterOptionType,
  UsageBreakdownResponse,
  UsageExportEstimate,
  UsageExportRequest,
  UsageMeta
} from '../config/types';

export const USAGE_META = '/usage/meta';
export const USAGE_BREAKDOWN = '/usage/breakdown';
export const USAGE_BREAKDOWN_EXPORT = '/usage/breakdown/export';
export const USAGE_BREAKDOWN_EXPORT_ESTIMATE =
  '/usage/breakdown/export/estimate';

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
    group_by: string[];
    granularity: string;
    page?: number;
    perPage?: number;
    sort_by?: string;
    filters: {
      routes?: FilterOptionType[];
      users?: FilterOptionType[];
      api_keys?: FilterOptionType[];
    };
  },
  options?: any
): Promise<UsageBreakdownResponse> {
  return request<UsageBreakdownResponse>(USAGE_BREAKDOWN, {
    data: params,
    method: 'POST',
    cancelToken: options?.token
  });
}

export async function queryUsageBreakdownList(
  params: Global.SearchParams & {
    filters: {
      routes?: FilterOptionType[];
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

// How many rows an export would produce, per sheet. Called before the user
// commits so the dialog can state the size (and refuse) up front instead of
// failing thirty seconds into a download.
export async function queryUsageExportEstimate(
  params: UsageExportRequest,
  options?: any
): Promise<UsageExportEstimate> {
  return request<UsageExportEstimate>(USAGE_BREAKDOWN_EXPORT_ESTIMATE, {
    data: params,
    method: 'POST',
    cancelToken: options?.token
  });
}

// The file itself. ``getResponse`` keeps the headers reachable so the server
// stays in charge of the filename (and therefore of the extension, which
// varies with format and sheet count: .csv, .xlsx or .zip).
export async function downloadUsageExport(
  params: UsageExportRequest,
  options?: any
): Promise<{ data: Blob; headers: Record<string, any> }> {
  return request(USAGE_BREAKDOWN_EXPORT, {
    data: params,
    method: 'POST',
    responseType: 'blob',
    getResponse: true,
    cancelToken: options?.token
  });
}
