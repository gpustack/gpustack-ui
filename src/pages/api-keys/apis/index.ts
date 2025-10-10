import { request } from '@umijs/max';
import { FormData, ListItem } from '../config/types';

export const APIS_KEYS_API = '/api-keys';

export async function queryApisKeysList(params: Global.SearchParams) {
  return request<Global.PageResponse<ListItem>>(`${APIS_KEYS_API}`, {
    method: 'GET',
    params
  });
}

export async function createApisKey(params: { data: FormData }) {
  return request<ListItem>(`${APIS_KEYS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateApisKey(id: number, params: { data: FormData }) {
  return request<ListItem>(`${APIS_KEYS_API}/${id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteApisKey(id: number) {
  return request(`${APIS_KEYS_API}/${id}`, {
    method: 'DELETE'
  });
}
