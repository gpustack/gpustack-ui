import { request } from '@umijs/max';
import { FlavorItem, FormData, ListItem } from '../config/types';

export const GPU_INSTANCE_TYPES_API = '/gpu-instance-types';

export const GPU_INSTANCE_TYPE_FLAVORS_API = '/gpu-instance-type-flavors';

// GET /gpu-instance-types?cluster_id — instance types defined on a cluster.
export async function queryGPUInstanceTypes(
  params: { cluster_id: number },
  options?: any
) {
  return request<{ items: ListItem[] }>(GPU_INSTANCE_TYPES_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

// GET /gpu-instance-type-flavors?cluster_id — the hardware flavors a new
// instance type can be based on.
export async function queryGPUInstanceTypeFlavors(
  params: { cluster_id: number },
  options?: any
) {
  return request<{ items: FlavorItem[] }>(GPU_INSTANCE_TYPE_FLAVORS_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

// POST /gpu-instance-types?cluster_id (GPUInstanceTypeCreate).
export async function createGPUInstanceType(params: {
  cluster_id: number;
  data: FormData;
}) {
  return request<ListItem>(GPU_INSTANCE_TYPES_API, {
    method: 'POST',
    params: { cluster_id: params.cluster_id },
    data: params.data
  });
}

// DELETE /gpu-instance-types/{name}?cluster_id.
export async function deleteGPUInstanceType(params: {
  name: string;
  cluster_id: number;
}) {
  return request(`${GPU_INSTANCE_TYPES_API}/${params.name}`, {
    method: 'DELETE',
    params: { cluster_id: params.cluster_id }
  });
}

// PUT /gpu-instance-types/{name}/activate?cluster_id — activate an instance type.
export async function activateGPUInstanceType(params: {
  name: string;
  cluster_id: number;
}) {
  return request(`${GPU_INSTANCE_TYPES_API}/${params.name}/activate`, {
    method: 'PUT',
    params: { cluster_id: params.cluster_id }
  });
}

// PUT /gpu-instance-types/{name}/deactivate?cluster_id — deactivate an instance type.
export async function deactivateGPUInstanceType(params: {
  name: string;
  cluster_id: number;
}) {
  return request(`${GPU_INSTANCE_TYPES_API}/${params.name}/deactivate`, {
    method: 'PUT',
    params: { cluster_id: params.cluster_id }
  });
}
