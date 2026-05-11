import { request } from '@umijs/max';
import { omitPathParams } from '../../utils';
import { ListItem, StorageClassItem } from '../config/types';

export const GPU_SERVICE_STORAGE_API = (params: {
  namespace: string;
  clusterID?: number;
}) =>
  `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instancepersistentvolumes`;

export const STORAGE_CLASS_API = (params: { clusterID?: number }) =>
  `/clusters/${params.clusterID}/proxy/apis/storage.k8s.io/v1/storageclasses`;

export async function queryGPUServiceStorage(
  params: Global.K8sSearchParams & {
    namespace: string;
    clusterID?: number;
  },
  options?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<Global.K8sPageResponse<ListItem>>(
    GPU_SERVICE_STORAGE_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    }),
    {
      method: 'GET',
      params: omitPathParams(params),
      cancelToken: options?.token
    }
  );
}

export async function createGPUServiceStorage(
  params: {
    namespace: string;
    clusterID?: number;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<ListItem>(
    GPU_SERVICE_STORAGE_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    }),
    {
      method: 'POST',
      data: params.data,
      cancelToken: option?.token
    }
  );
}

export async function updateGPUServiceStorage(
  params: {
    namespace: string;
    clusterID?: number;
    id: number;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<ListItem>(
    `${GPU_SERVICE_STORAGE_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    })}/${params.id}`,
    {
      method: 'PUT',
      data: params.data,
      cancelToken: option?.token
    }
  );
}

export async function deleteGPUServiceStorage(params: {
  namespace: string;
  clusterID?: number;
  id: number;
}) {
  if (!params.clusterID) {
    return;
  }
  return request(
    `${GPU_SERVICE_STORAGE_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    })}/${params.id}`,
    {
      method: 'DELETE'
    }
  );
}

export async function queryStorageClass(
  params: Global.K8sSearchParams & {
    clusterID?: number;
  },
  options?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<Global.K8sPageResponse<StorageClassItem>>(
    STORAGE_CLASS_API({ clusterID: params.clusterID }),
    {
      method: 'GET',
      params: omitPathParams(params),
      cancelToken: options?.token,
      headers: {
        skipErrorHandler: 'true'
      }
    }
  );
}
