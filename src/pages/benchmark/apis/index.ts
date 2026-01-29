import { request } from '@umijs/max';
import { CancelToken } from 'axios';
import {
  BenchmarkListItem,
  DatasetListItem,
  FormData,
  ProfileOption
} from '../config/types';

export const BENCHMARKS_API = '/benchmarks';
export const DATASETS_API = '/datasets';
export const PROFILES_CONFIG_API = '/benchmark-profiles/default-config';
export const EXPORT_BENCHMARK_LIST = '/benchmarks/export';

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

export async function queryProfiles(
  params: {
    id?: number | string;
  },
  options?: {
    token?: CancelToken;
  }
) {
  return request<{
    profiles: ProfileOption[];
  }>(`${PROFILES_CONFIG_API}`, {
    method: 'get',
    cancelToken: options?.token
  });
}

export async function exportBenchmarkList(
  params: {
    ids?: number[];
  },
  options?: {
    token?: CancelToken;
  }
) {
  return request(`${BENCHMARKS_API}/export`, {
    method: 'POST',
    data: params.ids,
    responseType: 'blob',
    cancelToken: options?.token
  });
}

export async function stopBenchmark(params: {
  id: number;
  data: Record<string, any>;
}) {
  return request(`${BENCHMARKS_API}/${params.id}/state`, {
    method: 'PATCH',
    data: params.data
  });
}
