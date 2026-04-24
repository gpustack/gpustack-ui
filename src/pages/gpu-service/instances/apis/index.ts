import { request } from '@umijs/max';
import { FormData, ListItem } from '../config/types';

export const GPU_SERVICE_INSTANCES_API = '/gpu-service-instances';

export async function queryGPUServiceInstances(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(GPU_SERVICE_INSTANCES_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function createGPUServiceInstance(params: { data: FormData }) {
  return request<ListItem>(GPU_SERVICE_INSTANCES_API, {
    method: 'POST',
    data: params.data
  });
}

export async function updateGPUServiceInstance(params: {
  id: number;
  data: FormData;
}) {
  return request<ListItem>(`${GPU_SERVICE_INSTANCES_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteGPUServiceInstance(id: number) {
  return request(`${GPU_SERVICE_INSTANCES_API}/${id}`, {
    method: 'DELETE'
  });
}
