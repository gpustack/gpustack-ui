import { request } from '@umijs/max';
import { AccessItem, FormData } from '../config/types';

export const ACCESS_API = '/accesses';

export const ACCESS_POINTS_API = '/models';

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

export async function queryAccessPoints(params: { id: string }, options?: any) {
  return request<Global.BaseOption<string>[]>(
    `${ACCESS_API}/${params.id}/points`,
    {
      method: 'GET',
      cancelToken: options?.token
    }
  );
}
