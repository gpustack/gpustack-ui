import { request } from '@umijs/max';
import { InstanceTypeItem, ListItem } from '../config/types';

export const GPU_SERVICE_INSTANCES_API = (params: {
  namespace: string;
  clusterID?: number;
}) =>
  `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instances`;

export const GPU_SERVICE_INSTANCES_TYPE_API = (params: {
  clusterID?: number;
}) =>
  `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/instancetypes`;

export async function queryGPUServiceInstances(
  params: Global.K8sSearchParams & {
    namespace: string;
    clusterID?: number;
  },
  options?: any
) {
  return request<Global.K8sPageResponse<ListItem>>(
    GPU_SERVICE_INSTANCES_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    }),
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}

export async function createGPUServiceInstance(
  params: {
    namespace: string;
    clusterID?: number;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  return request<ListItem>(
    GPU_SERVICE_INSTANCES_API({
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

export async function updateGPUServiceInstance(
  params: {
    namespace: string;
    clusterID?: number;
    id: number;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  return request<ListItem>(
    `${GPU_SERVICE_INSTANCES_API({
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

export async function deleteGPUServiceInstance(
  params: {
    namespace: string;
    clusterID?: number;
    id: number;
  },
  option?: any
) {
  return request(
    `${GPU_SERVICE_INSTANCES_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    })}/${params.id}`,
    {
      method: 'DELETE',
      cancelToken: option?.token
    }
  );
}

// =========== Instance Types ===========

export async function queryGPUServiceInstanceTypes(
  params: Global.K8sSearchParams & { clusterID?: number },
  options?: any
) {
  return request<Global.K8sPageResponse<InstanceTypeItem>>(
    GPU_SERVICE_INSTANCES_TYPE_API({ clusterID: params.clusterID }),
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}

export async function queryGPUServiceInstanceTypeItems(
  params: {
    name: string;
    clusterID?: number;
  },
  options?: any
) {
  return request<InstanceTypeItem>(
    `${GPU_SERVICE_INSTANCES_TYPE_API({ clusterID: params.clusterID })}/${params.name}`,
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}
