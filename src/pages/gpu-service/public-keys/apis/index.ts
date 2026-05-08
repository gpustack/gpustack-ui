import { request } from '@umijs/max';
import { FormData, ListItem } from '../types';

export const GPU_SERVICE_PUBLIC_KEY_API = (namespace: string) =>
  `/proxy/apis/worker.gpustack.ai/v1/namespaces/${namespace}/instancesshpublickeys`;

export async function queryGPUServicePublicKeys(
  params: Global.K8sSearchParams,
  options?: any
) {
  return request<Global.K8sPageResponse<ListItem>>(
    GPU_SERVICE_PUBLIC_KEY_API(params.namespace || ''),
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}

export async function createGPUServicePublicKey(params: {
  namespace: string;
  data: FormData;
}) {
  return request<ListItem>(GPU_SERVICE_PUBLIC_KEY_API(params.namespace), {
    method: 'POST',
    data: params.data
  });
}

export async function updateGPUServicePublicKey(params: {
  namespace: string;
  id: number;
  data: FormData;
}) {
  return request<ListItem>(
    `${GPU_SERVICE_PUBLIC_KEY_API(params.namespace)}/${params.id}`,
    {
      method: 'PUT',
      data: params.data
    }
  );
}

export async function deleteGPUServicePublicKey(params: {
  namespace: string;
  id: number;
}) {
  return request(
    `${GPU_SERVICE_PUBLIC_KEY_API(params.namespace)}/${params.id}`,
    {
      method: 'DELETE'
    }
  );
}
