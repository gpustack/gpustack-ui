import { listFiles } from '@huggingface/hub';
import { request } from '@umijs/max';
import {
  FormData,
  ListItem,
  ModelInstanceFormData,
  ModelInstanceListItem
} from '../config/types';

export const MODELS_API = '/models';

export const MODEL_INSTANCE_API = '/model-instances';

// ===================== Models =====================
export async function queryModelsList(
  params: Global.Pagination & { query?: string },
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(`${MODELS_API}`, {
    methos: 'GET',
    params,
    ...options
  });
}

export async function createModel(params: { data: FormData }) {
  return request(`${MODELS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function deleteModel(id: number) {
  return request(`${MODELS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function updateModel(params: { id: number; data: FormData }) {
  return request(`${MODELS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function queryModelDetail(id: number) {
  return request(`${MODELS_API}/${id}`, {
    method: 'GET'
  });
}

// ===================== Model Instances start =====================

export async function queryModelInstancesList(
  params: Global.Pagination & { query?: string; id: number }
) {
  return request<Global.PageResponse<ModelInstanceListItem>>(
    `${MODELS_API}/${params.id}/instances`,
    {
      method: 'GET',
      params
    }
  );
}

export async function createModelInstance(params: {
  data: ModelInstanceFormData;
}) {
  return request(`${MODEL_INSTANCE_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function deleteModelInstance(id: number) {
  return request(`${MODEL_INSTANCE_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function updateModelInstance(params: {
  id: number;
  data: FormData;
}) {
  return request(`${MODEL_INSTANCE_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function queryModelInstanceDetail(id: number) {
  return request(`${MODEL_INSTANCE_API}/${id}`, {
    method: 'GET'
  });
}

export async function queryModelInstanceLogs(id: number) {
  return request(`${MODEL_INSTANCE_API}/${id}/logs`, {
    method: 'GET'
  });
}

// ===================== Model Instances end =====================

// ===================== call huggingface quicksearch api =====================

export async function callHuggingfaceQuickSearch(params: any) {
  return request<{
    models: Array<{
      id: string;
      _id: string;
    }>;
  }>(`https://huggingface.co/api/quicksearch`, {
    method: 'GET',
    params
  });
}

export async function queryHuggingfaceModelFiles(params: { repo: string }) {
  const result = [];
  for await (const fileInfo of listFiles(params)) {
    result.push(fileInfo);
  }
  return result;
}
