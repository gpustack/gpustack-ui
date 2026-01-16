import { request } from '@umijs/max';
import { FormData, MaasProviderItem } from '../config/types';

export const MAAS_PROVIDERS_API = '/maas-providers';

export const PROVIDER_MODELS_API = '/maas-provider-models';

export async function queryMaasProviders(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<MaasProviderItem>>(MAAS_PROVIDERS_API, {
    params,
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function createProvider(params: { data: FormData }) {
  return request(`${MAAS_PROVIDERS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateProvider(params: { id: number; data: FormData }) {
  return request(`${MAAS_PROVIDERS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteProvider(id: number) {
  return request(`${MAAS_PROVIDERS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function queryProviderModels(
  params: { id: string },
  options?: any
) {
  return request<Global.BaseOption<string>[]>(
    `${MAAS_PROVIDERS_API}/${params.id}/models`,
    {
      method: 'GET',
      cancelToken: options?.token
    }
  );
}
