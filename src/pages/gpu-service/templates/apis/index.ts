import { request } from '@umijs/max';
import { mockTemplateData } from '../config/mock-data';
import { FormData, ListItem } from '../config/types';

export const GPU_SERVICE_TEMPLATES_API = '/gpu-service-templates';

export async function queryGPUServiceTemplates(
  params: Global.SearchParams,
  options?: any
) {
  // return request<Global.PageResponse<ListItem>>(GPU_SERVICE_TEMPLATES_API, {
  //   method: 'GET',
  //   params,
  //   cancelToken: options?.token
  // });
  const page = params.page || 1;
  const perPage = params.perPage || 24;
  const search = params.search?.toLowerCase();
  const vendor = params.vendor;
  const filteredData = mockTemplateData.filter((item) => {
    const matchSearch = search
      ? item.name.toLowerCase().includes(search)
      : true;
    const matchVendor = vendor ? item.vendor === vendor : true;
    return matchSearch && matchVendor;
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

export async function createGPUServiceTemplate(params: { data: FormData }) {
  // return request<ListItem>(GPU_SERVICE_TEMPLATES_API, {
  //   method: 'POST',
  //   data: params.data
  // });
  return true;
}

export async function updateGPUServiceTemplate(params: {
  id: number;
  data: FormData;
}) {
  // return request<ListItem>(`${GPU_SERVICE_TEMPLATES_API}/${params.id}`, {
  //   method: 'PUT',
  //   data: params.data
  // });
  return true;
}

export async function deleteGPUServiceTemplate(id: number) {
  return request(`${GPU_SERVICE_TEMPLATES_API}/${id}`, {
    method: 'DELETE'
  });
}
