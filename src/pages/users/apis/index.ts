import { request } from '@umijs/max';
import { FormData, ListItem } from '../config/types';

export const USERS_API = '/users';

export async function queryUsersList(params: Global.SearchParams) {
  return request<Global.PageResponse<ListItem>>(`${USERS_API}`, {
    methos: 'GET',
    params
  });
}

export async function createUser(params: { data: FormData }) {
  return request(`${USERS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateUser(params: { data: FormData }) {
  return request(`${USERS_API}/${params.data.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteUser(id: number) {
  return request(`${USERS_API}/${id}`, {
    method: 'DELETE'
  });
}
