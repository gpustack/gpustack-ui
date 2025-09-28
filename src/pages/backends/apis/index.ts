import { request } from '@umijs/max';
import { FormData, ListItem } from '../config/types';

export const INFERENCE_BACKEND_API = '/inference-backends';

export const FROM_YAML_API = '/from-yaml';

export async function queryBackendsList(params: Global.SearchParams) {
  return request<Global.PageResponse<ListItem>>(`${INFERENCE_BACKEND_API}`, {
    method: 'GET',
    params
  });
}

export async function createBackend(params: { data: FormData }) {
  return request<ListItem>(`${INFERENCE_BACKEND_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateBackend(id: number, params: { data: FormData }) {
  return request<ListItem>(`${INFERENCE_BACKEND_API}/${id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteBackend(id: number) {
  return request(`${INFERENCE_BACKEND_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function createBackendFromYAML(params: {
  data: { content: string };
}) {
  return request<ListItem>(`${INFERENCE_BACKEND_API}${FROM_YAML_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateBackendFromYAML(
  id: number,
  params: { data: { content: string } }
) {
  return request<ListItem>(`${INFERENCE_BACKEND_API}/${id}${FROM_YAML_API}`, {
    method: 'PUT',
    data: params.data
  });
}
