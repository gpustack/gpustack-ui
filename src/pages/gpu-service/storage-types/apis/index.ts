import { request } from '@umijs/max';
import { FormData, ListItem } from '../config/types';

export const GPU_SERVICE_STORAGE_TYPE_API =
  '/gpu-instance-persistent-volume-types';

export async function queryGPUServiceStorageTypes(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(GPU_SERVICE_STORAGE_TYPE_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function createGPUServiceStorageType(params: {
  data: Omit<FormData, 'type'>;
}) {
  return request<ListItem>(GPU_SERVICE_STORAGE_TYPE_API, {
    method: 'POST',
    data: params.data
  });
}

export async function updateGPUServiceStorageType(params: {
  id: number;
  data: Omit<FormData, 'type' | 'name'>;
}) {
  return request<ListItem>(`${GPU_SERVICE_STORAGE_TYPE_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteGPUServiceStorageType(id: number) {
  return request(`${GPU_SERVICE_STORAGE_TYPE_API}/${id}`, {
    method: 'DELETE'
  });
}
