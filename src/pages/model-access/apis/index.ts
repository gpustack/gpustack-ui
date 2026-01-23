import { request } from '@umijs/max';
import { AccessItem, AccessPointItem, FormData } from '../config/types';

export const ACCESS_API = '/model-accesses';

export const ACCESS_POINTS_API = '/model-access-endpoints';

export async function queryModelAccesses(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<AccessItem>>(ACCESS_API, {
    params,
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function createAccess(params: { data: FormData }) {
  return request(`${ACCESS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateAccess(params: { id: number; data: FormData }) {
  return request(`${ACCESS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteAccess(id: number) {
  return request(`${ACCESS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function queryAccessPoints(params: { id: number }, options?: any) {
  return request<Global.PageResponse<AccessPointItem>>(
    `${ACCESS_POINTS_API}?access_id=${params.id}`,
    {
      method: 'GET',
      params: {
        page: -1
      },
      cancelToken: options?.token
    }
  );
}

export async function deleteAccessPoint(id: number) {
  return request(`${ACCESS_POINTS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function updateAccessPoint(params: {
  id: number;
  data: Partial<AccessPointItem>;
}) {
  return request(`${ACCESS_POINTS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function setAccessPointAsFallback(params: {
  id: number;
  data: Partial<AccessPointItem>;
}) {
  return request(`${ACCESS_POINTS_API}/${params.id}/set-fallback`, {
    method: 'POST',
    data: params.data
  });
}
