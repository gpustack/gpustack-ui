import { request } from '@umijs/max';
import { InstanceTypeItem, ListItem } from '../config/types';

export const GPU_SERVICE_INSTANCES_API = (namespace: string) =>
  `/proxy/apis/worker.gpustack.ai/v1/namespaces/${namespace}/instances`;

export const GPU_SERVICE_INSTANCES_TYPE_API =
  '/proxy/apis/worker.gpustack.ai/v1/instancetypes';

export async function queryGPUServiceInstances(
  params: Global.K8sSearchParams,
  options?: any
) {
  return request<Global.K8sPageResponse<ListItem>>(
    GPU_SERVICE_INSTANCES_API(params.namespace || ''),
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
    data: Global.K8sCommonData;
  },
  option?: any
) {
  return request<ListItem>(GPU_SERVICE_INSTANCES_API(params.namespace), {
    method: 'POST',
    data: params.data,
    cancelToken: option?.token
  });
}

export async function updateGPUServiceInstance(
  params: {
    namespace: string;
    id: number;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  return request<ListItem>(
    `${GPU_SERVICE_INSTANCES_API(params.namespace)}/${params.id}`,
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
    id: number;
  },
  option?: any
) {
  return request(
    `${GPU_SERVICE_INSTANCES_API(params.namespace)}/${params.id}`,
    {
      method: 'DELETE',
      cancelToken: option?.token
    }
  );
}

// =========== Instance Types ===========

export async function queryGPUServiceInstanceTypes(
  params: Global.K8sSearchParams,
  options?: any
) {
  return request<Global.K8sPageResponse<InstanceTypeItem>>(
    GPU_SERVICE_INSTANCES_TYPE_API,
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
  },
  options?: any
) {
  return request<InstanceTypeItem>(
    `${GPU_SERVICE_INSTANCES_TYPE_API}/${params.name}`,
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}
