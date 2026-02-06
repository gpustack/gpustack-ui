import { request } from '@umijs/max';
import { FormData, MaasProviderItem } from '../config/types';

export const MAAS_PROVIDERS_API = '/model-providers';

export const GET_PROVIDER_MODELS_API = '/get-models';

export const TEST_PROVIDER_MODEL_API = '/test-model';

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
  params: {
    data: {
      api_token: string;
      proxy_url: string;
      config: {
        type: string;
      };
    };
  },
  options?: any
) {
  return request<{ data: any[] }>(
    `${MAAS_PROVIDERS_API}${GET_PROVIDER_MODELS_API}`,
    {
      method: 'post',
      data: params.data,
      cancelToken: options?.token
    }
  );
}

export async function queryProviderModelsInEditing(
  params: {
    id?: number;
    data: {
      api_token: string;
      proxy_url: string;
      config: {
        type: string;
      };
    };
  },
  options?: any
) {
  return request<{ data: any[] }>(
    `${MAAS_PROVIDERS_API}/${params.id}/get-models`,
    {
      method: 'POST',
      data: params.data,
      cancelToken: options?.token
    }
  );
}

export async function testProviderModel(
  params: {
    data: {
      model_name: string;
      api_token: string;
      proxy_url: string;
      config: {
        type: string;
      };
    };
  },
  options?: any
) {
  return request<any>(`${MAAS_PROVIDERS_API}${TEST_PROVIDER_MODEL_API}`, {
    method: 'post',
    data: params.data,
    cancelToken: options?.token
  });
}

export async function testProviderModelInEditing(
  params: {
    id?: number;
    data: {
      model_name: string;
      api_token: string;
      proxy_url: string;
      config: {
        type: string;
      };
    };
  },
  options?: any
) {
  return request<any>(
    `${MAAS_PROVIDERS_API}/${params.id}${TEST_PROVIDER_MODEL_API}`,
    {
      method: 'post',
      data: params.data,
      cancelToken: options?.token
    }
  );
}
