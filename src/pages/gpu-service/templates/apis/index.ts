import { request } from '@umijs/max';
import { FormData, ListItem } from '../config/types';

export const GPU_SERVICE_TEMPLATES_API = '/gpu-service-templates';

export async function queryGPUServiceTemplates(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(GPU_SERVICE_TEMPLATES_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function createGPUServiceTemplate(params: { data: FormData }) {
  return request<ListItem>(GPU_SERVICE_TEMPLATES_API, {
    method: 'POST',
    data: params.data
  });
}

export async function updateGPUServiceTemplate(params: {
  id: number;
  data: FormData;
}) {
  return request<ListItem>(`${GPU_SERVICE_TEMPLATES_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteGPUServiceTemplate(id: number) {
  return request(`${GPU_SERVICE_TEMPLATES_API}/${id}`, {
    method: 'DELETE'
  });
}
