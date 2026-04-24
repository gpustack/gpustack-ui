import { request } from '@umijs/max';
import { mockStorageData } from '../config/mock-data';
import { FormData, ListItem } from '../config/types';

export const GPU_SERVICE_STORAGE_API = '/gpu-service-storage';

export async function queryGPUServiceStorage(
  params: Global.SearchParams,
  options?: any
) {
  // return request<Global.PageResponse<ListItem>>(GPU_SERVICE_STORAGE_API, {
  //   method: 'GET',
  //   params,
  //   cancelToken: options?.token
  // });
  const page = params.page || 1;
  const perPage = params.perPage || 10;
  const search = params.search?.toLowerCase();
  const clusterId = params.cluster_id;
  const filteredData = mockStorageData.filter((item) => {
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
  } as Global.PageResponse<ListItem>;
}

export async function createGPUServiceStorage(params: { data: FormData }) {
  // return request<ListItem>(GPU_SERVICE_STORAGE_API, {
  //   method: 'POST',
  //   data: params.data
  // });
  return true;
}

export async function updateGPUServiceStorage(params: {
  id: number;
  data: FormData;
}) {
  // return request<ListItem>(`${GPU_SERVICE_STORAGE_API}/${params.id}`, {
  //   method: 'PUT',
  //   data: params.data
  // });
  return true;
}

export async function deleteGPUServiceStorage(id: number) {
  return request(`${GPU_SERVICE_STORAGE_API}/${id}`, {
    method: 'DELETE'
  });
}
