import { request } from '@umijs/max';
import { FormData } from '../config/types';

export const CREDENTIALS_API = '/credentials';

export async function queryCredentialList(params: Global.SearchParams) {
  // return request<Global.PageResponse<ListItem>>(`${CREDENTIALS_API}`, {
  //   method: 'GET',
  //   params
  // });
}

export async function createCredential(params: { data: FormData }) {
  return request(`${CREDENTIALS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateCredential(params: { data: FormData }) {
  return request(`${CREDENTIALS_API}/${params.data.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteCredential(id: number) {
  return request(`${CREDENTIALS_API}/${id}`, {
    method: 'DELETE'
  });
}
