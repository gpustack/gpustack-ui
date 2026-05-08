import { request } from '@umijs/max';
import { mockInstanceData } from '../config/mock-data';
import { FormData, InstanceTypeItem, ListItem } from '../config/types';

export const GPU_SERVICE_INSTANCES_API = (namespace: string) =>
  `/proxy/apis/worker.gpustack.ai/v1/namespaces/${namespace}/instances`;

export const GPU_SERVICE_INSTANCES_TYPE_API =
  '/proxy/apis/worker.gpustack.ai/v1/instancetypes';

export async function queryGPUServiceInstances(
  params: Global.K8sSearchParams,
  options?: any
) {
  // return request<Global.PageResponse<ListItem>>(GPU_SERVICE_INSTANCES_API, {
  //   method: 'GET',
  //   params,
  //   cancelToken: options?.token
  // });
  const page = params.page || 1;
  const perPage = params.perPage || 10;
  const search = params.search?.toLowerCase();
  const clusterId = params.cluster_id;
  const filteredData = mockInstanceData.filter((item) => {
    const matchSearch = search
      ? item.name.toLowerCase().includes(search)
      : true;
    const matchCluster = clusterId ? item.cluster_id === clusterId : true;
    return matchSearch && matchCluster;
  });
  const start = (page - 1) * perPage;
  const items = filteredData.slice(start, start + perPage);

  return {
    items,
    pagination: {
      total: filteredData.length,
      totalPage: Math.ceil(filteredData.length / perPage),
      page,
      perPage
    }
  } as Global.K8sPageResponse<ListItem>;
}

export async function createGPUServiceInstance(params: { data: FormData }) {
  // return request<ListItem>(GPU_SERVICE_INSTANCES_API, {
  //   method: 'POST',
  //   data: params.data
  // });
  return true;
}

export async function updateGPUServiceInstance(params: {
  id: number;
  data: FormData;
}) {
  // return request<ListItem>(`${GPU_SERVICE_INSTANCES_API}/${params.id}`, {
  //   method: 'PUT',
  //   data: params.data
  // });
  return true;
}

export async function deleteGPUServiceInstance(id: number) {
  return request(`${GPU_SERVICE_INSTANCES_API}/${id}`, {
    method: 'DELETE'
  });
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
