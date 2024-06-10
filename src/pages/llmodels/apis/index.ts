import { request } from '@umijs/max';
import { FormData, ListItem } from '../config/types';

export const MODELS_API = '/models';

export async function queryModelsList(
  params: Global.Pagination & { query?: string }
) {
  return request<Global.PageResponse<ListItem>>(`${MODELS_API}`, {
    methos: 'GET',
    params
  });
}

export async function createModel(params: { data: FormData }) {
  return request(`${MODELS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function deleteModel(id: number) {
  return request(`${MODELS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function updateModel(params: { id: number; data: FormData }) {
  return request(`${MODELS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}
