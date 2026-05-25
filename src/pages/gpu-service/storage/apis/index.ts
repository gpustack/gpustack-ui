import { request } from '@umijs/max';
import {
  FormData,
  ListItem,
  StorageClassItem,
  UpdateData
} from '../config/types';

export const GPU_SERVICE_STORAGE_API = '/gpu-instance-persistent-volumes';

export const STORAGE_CLASS_API = '/gpu-instance-persistent-volume-types';

export async function queryGPUServiceStorage(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(GPU_SERVICE_STORAGE_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function createGPUServiceStorage(params: { data: FormData }) {
  return request<ListItem>(GPU_SERVICE_STORAGE_API, {
    method: 'POST',
    data: params.data
  });
}

export async function updateGPUServiceStorage(params: {
  id: number;
  data: UpdateData;
}) {
  return request<ListItem>(`${GPU_SERVICE_STORAGE_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteGPUServiceStorage(id: number) {
  return request(`${GPU_SERVICE_STORAGE_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function queryStorageClass(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<StorageClassItem>>(STORAGE_CLASS_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}
