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
// Takes the url so ONE pair of functions serves every Usage tab. They used to
// differ only in whether the endpoint was baked in, which forced the caller to
// dispatch on a string comparison against this module's constant.
export async function queryUsageExportEstimate(
  url: string,
  params: UsageExportRequest | Record<string, any>,
  options?: any
): Promise<UsageExportEstimate> {
  return request<UsageExportEstimate>(url, {
    data: params,
    method: 'POST',
    cancelToken: options?.token,
    // The estimate's own failure is handled by the caller, which deliberately
    // stays quiet: a sizing call that didn't come back should leave the button
    // usable, not raise an alarm. Without this the global handler pops
    // "Request failed with status code 500" anyway, turning a designed silence
    // into noise the user can do nothing about.
    skipErrorHandler: true
  });
}

// The file itself. ``getResponse`` keeps the headers reachable so the server
// stays in charge of the filename (and therefore of the extension, which
// varies with format and sheet count: .csv, .xlsx or .zip).
export async function downloadUsageExport(
  url: string,
  params: UsageExportRequest | Record<string, any>,
  options?: any
): Promise<{ data: Blob; headers: Record<string, any> }> {
  return request(url, {
    data: params,
    method: 'POST',
    responseType: 'blob',
    getResponse: true,
    cancelToken: options?.token,
    // The caller reads the error body itself to produce an actionable message
    // (how far to narrow the range, how many files a split needs). Leaving the
    // global handler on adds a second toast beside it — and a useless one:
    // ``response.data`` is a Blob here, so it degrades to axios's own
    // "Request failed with status code 422".
    skipErrorHandler: true
  });
}
