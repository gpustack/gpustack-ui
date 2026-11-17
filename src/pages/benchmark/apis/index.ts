import { request } from '@umijs/max';
import { CancelToken } from 'axios';
import type {
  BenchmarkArchiveStatus,
  BenchmarkMonitoring,
  BenchmarkMonitoringQuery,
  BenchmarkPhaseObservations,
  BenchmarkResourceMetrics,
  BenchmarkRuntimeMetrics
} from '../config/monitoring-types';
import {
  BenchmarkListItem,
  BenchmarkResultItem,
  FormData,
  ProfileOption
} from '../config/types';

export const BENCHMARKS_API = '/benchmarks';
export const PROFILES_CONFIG_API = '/benchmark-profiles/default-config';
export const EXPORT_BENCHMARK_LIST = '/benchmarks/export';

export const queryBenchmarkMonitoring = (
  id: number,
  signal?: AbortSignal,
  params?: Pick<BenchmarkMonitoringQuery, 'run_id'>
) =>
  request<BenchmarkMonitoring>(`${BENCHMARKS_API}/${id}/monitoring`, {
    method: 'GET',
    params,
    signal,
    skipErrorHandler: true
  });

export const queryBenchmarkPhaseObservations = (
  id: number,
  params: Pick<BenchmarkMonitoringQuery, 'run_id' | 'content_version'> & {
    phase_ids: string;
  },
  signal?: AbortSignal
) =>
  request<BenchmarkPhaseObservations>(
    `${BENCHMARKS_API}/${id}/phase-observations`,
    {
      method: 'GET',
      params,
      signal,
      skipErrorHandler: true
    }
  );

export const retryBenchmarkMonitoringArchive = (id: number, run_id?: string) =>
  request<BenchmarkArchiveStatus>(
    `${BENCHMARKS_API}/${id}/monitoring-archive/retry`,
    {
      method: 'POST',
      data: run_id ? { run_id } : undefined,
      skipErrorHandler: true
    }
  );

export const queryBenchmarkMonitoringArchive = (
  id: number,
  params: Pick<BenchmarkMonitoringQuery, 'run_id'>,
  signal?: AbortSignal
) =>
  request<BenchmarkArchiveStatus>(
    `${BENCHMARKS_API}/${id}/monitoring-archive`,
    {
      method: 'GET',
      params,
      signal,
      skipErrorHandler: true
    }
  );

export const queryBenchmarkMetrics = (
  id: number,
  params: BenchmarkMonitoringQuery,
  signal?: AbortSignal
) =>
  request<BenchmarkRuntimeMetrics>(`${BENCHMARKS_API}/${id}/metrics`, {
    method: 'GET',
    params: { ...params, statistic: 'avg,p50,p95,p99', section: 'all' },
    signal,
    skipErrorHandler: true
  });

export const queryBenchmarkResourceMetrics = (
  id: number,
  params: BenchmarkMonitoringQuery,
  signal?: AbortSignal
) =>
  request<BenchmarkResourceMetrics>(
    `${BENCHMARKS_API}/${id}/resource-metrics`,
    {
      method: 'GET',
      params,
      signal,
      skipErrorHandler: true
    }
  );

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

// Per-point results (one row per (input_tokens, rate) grid cell) for the
// multi-rate detail view (curve + summary table).
export async function queryBenchmarkResults(
  id: number,
  options?: {
    token?: CancelToken;
  }
) {
  return request<BenchmarkResultItem[]>(`${BENCHMARKS_API}/${id}/results`, {
    method: 'GET',
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
