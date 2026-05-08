import { request } from '@umijs/max';
import { ListItem } from '../config/types';

export const GPU_SERVICE_STORAGE_API = (namespace: string) =>
  `/proxy/apis/worker.gpustack.ai/v1/namespaces/${namespace}/instancepersistentvolumes`;

export async function queryGPUServiceStorage(
  params: Global.K8sSearchParams,
  options?: any
) {
  return request<Global.K8sPageResponse<ListItem>>(
    GPU_SERVICE_STORAGE_API(params.namespace || ''),
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}

export async function createGPUServiceStorage(
  params: {
    namespace: string;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  return request<ListItem>(GPU_SERVICE_STORAGE_API(params.namespace), {
    method: 'POST',
    data: params.data,
    cancelToken: option?.token
  });
}

export async function updateGPUServiceStorage(
  params: {
    namespace: string;
    id: number;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  return request<ListItem>(
    `${GPU_SERVICE_STORAGE_API(params.namespace)}/${params.id}`,
    {
      method: 'PUT',
      data: params.data,
      cancelToken: option?.token
    }
  );
}

export async function deleteGPUServiceStorage(params: {
  namespace: string;
  id: number;
}) {
  return request(`${GPU_SERVICE_STORAGE_API(params.namespace)}/${params.id}`, {
    method: 'DELETE'
  });
}
