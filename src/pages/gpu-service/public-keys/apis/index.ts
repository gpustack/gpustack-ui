import { request } from '@umijs/max';
import { FormData, ListItem } from '../types';

export const GPU_SERVICE_PUBLIC_KEY_API = '/gpu-instance-ssh-public-keys/data';

export async function queryGPUServicePublicKeys(
  params: Global.SearchParams,
  options?: any
) {
  return request<ListItem>(GPU_SERVICE_PUBLIC_KEY_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function createGPUServicePublicKey(params: { data: FormData }) {
  return request<ListItem>(GPU_SERVICE_PUBLIC_KEY_API, {
    method: 'POST',
    data: params.data
  });
}

export async function updateGPUServicePublicKey(params: { data: FormData }) {
  return request<ListItem>(`${GPU_SERVICE_PUBLIC_KEY_API}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteGPUServicePublicKey(id: number) {
  return request(`${GPU_SERVICE_PUBLIC_KEY_API}/${id}`, {
    method: 'DELETE'
  });
}
