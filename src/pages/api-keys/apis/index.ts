import { request } from '@umijs/max';
import { FormData, ListItem } from '../config/types';

export const APIS_KEYS_API = '/api_keys';

export async function queryApisKeysList(
  params: Global.Pagination & { query?: string }
) {
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

export async function deleteApisKey(id: number) {
  return request(`${APIS_KEYS_API}/${id}`, {
    method: 'DELETE'
  });
}
