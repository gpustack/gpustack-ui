import { request } from '@umijs/max';
import {
  CacheProviderItem,
  CacheServiceInstanceItem,
  CacheServiceModelItem,
  FormData,
  ListItem
} from '../config/types';

export const CACHE_SERVICES_API = '/cache-services';

export const CACHE_PROVIDERS_API = '/cache-providers';

export async function queryCacheProviders(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<CacheProviderItem>>(CACHE_PROVIDERS_API, {
    params,
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function queryCacheServices(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(CACHE_SERVICES_API, {
    params,
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function createCacheService(params: { data: FormData }) {
  return request(`${CACHE_SERVICES_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateCacheService(
  id: number,
  params: { data: FormData }
) {
  return request(`${CACHE_SERVICES_API}/${id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function queryCacheServiceDetail(id: number, options?: any) {
  return request<ListItem>(`${CACHE_SERVICES_API}/${id}`, {
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function queryCacheServiceModels(id: number, options?: any) {
  return request<{ items: CacheServiceModelItem[] }>(
    `${CACHE_SERVICES_API}/${id}/models`,
    {
      method: 'GET',
      cancelToken: options?.token
    }
  );
}

// managed services only; the full (unpaginated) set ordered by worker
export async function queryCacheServiceInstances(id: number, options?: any) {
  return request<Global.PageResponse<CacheServiceInstanceItem>>(
    `${CACHE_SERVICES_API}/${id}/instances`,
    {
      method: 'GET',
      cancelToken: options?.token
    }
  );
}

// deletes one instance; the controller recreates it immediately
export async function deleteCacheServiceInstance(
  id: number,
  instanceId: number
) {
  return request(`${CACHE_SERVICES_API}/${id}/instances/${instanceId}`, {
    method: 'DELETE'
  });
}

export async function deleteCacheService(id: number) {
  return request(`${CACHE_SERVICES_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function testCacheServiceConnection(params: {
  data: {
    provider_name: string;
    provider_version?: string;
    endpoint: {
      host?: string;
      port: number;
    };
  };
}) {
  return request<{ reachable: boolean; message?: string }>(
    `${CACHE_SERVICES_API}/test-connection`,
    {
      method: 'POST',
      data: params.data
    }
  );
}
