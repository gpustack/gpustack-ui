import { request } from '@umijs/max';
import { CancelToken } from 'axios';
import { BenchmarkMetricsFormData } from '../config/detail-types';
import { BenchmarkListItem, DatasetListItem, FormData } from '../config/types';

export const BENCHMARKS_API = '/benchmarks';
export const DATASETS_API = '/datasets';

export async function queryBenchmarkList(
  params: Global.SearchParams,
  options?: {
    token?: CancelToken;
  }
) {
  return request<Global.PageResponse<BenchmarkListItem>>(`${BENCHMARKS_API}`, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function createBenchmark(params: { data: FormData }) {
  return request(`${BENCHMARKS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateBenchmark(params: { id: number; data: FormData }) {
  return request(`${BENCHMARKS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteBenchmark(id: number) {
  return request(`${BENCHMARKS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function queryBenchmarkLogs(
  id: number,
  options?: {
    token?: CancelToken;
  }
) {
  return request(`${BENCHMARKS_API}/${id}/logs`, {
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function queryBenchmarkDetail(
  id: number,
  options?: {
    token?: CancelToken;
  }
) {
  return request(`${BENCHMARKS_API}/${id}`, {
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function createBenchmarkResult(params: { id: number; data: any }) {
  return request(`${BENCHMARKS_API}/${params.id}/result`, {
    method: 'POST',
    data: params.data
  });
}

export async function queryDatasetList(
  params: Global.SearchParams,
  options?: {
    token?: CancelToken;
  }
) {
  return request<Global.PageResponse<DatasetListItem>>(`${DATASETS_API}`, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function queryBenchmarkMetrics(
  params: {
    id: number;
    data: BenchmarkMetricsFormData;
  },
  options?: {
    token?: CancelToken;
  }
) {
  return request<any>(`${BENCHMARKS_API}/${params.id}/metrics`, {
    method: 'POST',
    data: params.data,
    cancelToken: options?.token
  });
}
