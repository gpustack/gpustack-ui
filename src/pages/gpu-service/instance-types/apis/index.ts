import { request } from '@umijs/max';
import { FlavorItem, FormData, ListItem } from '../config/types';

export const GPU_INSTANCE_TYPES_API = '/gpu-instance-types';

export const GPU_INSTANCE_TYPE_FLAVORS_API = '/gpu-instance-type-flavors';

// GET /gpu-instance-types — the control-plane record table, fleet-wide.
// `cluster_id` is a filter rather than a scope here, so a cluster with no ready
// worker yields an empty page instead of its proxy's 5xx.
//
// `source: 'live'` swaps that for a proxy read of one named cluster, the only
// read that carries the volatile resource ledger (`status.acceleratorSliced` /
// `status.acceleratorPartitioned`) the record table deliberately drops. It
// requires `cluster_id` and rejects `search`.
//
// `purpose` narrows nothing when omitted, which is load-bearing: the page asks
// for `gpu_service`, while the model deploy form's GPU type picker targets
// Model Service clusters and must keep sending none.
export async function queryGPUInstanceTypes(
  params: {
    cluster_id?: number;
    page?: number;
    perPage?: number;
    search?: string;
    sort_by?: string;
    purpose?: 'gpu_service' | 'model_service';
    source?: 'record' | 'live';
  },
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(GPU_INSTANCE_TYPES_API, {
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

// Every write below proxies into the named cluster, so an unreachable cluster
// answers 503 with the proxy's bare "Service Unavailable" — nothing an operator
// can act on. They therefore skip the global error toast and let their caller
// map the status onto an actionable message (see the page's `runWrite`). It
// only suppresses the toast: the interceptor's 401 handling still runs.
const skipErrorHandler = true;

// POST /gpu-instance-types?cluster_id (GPUInstanceTypeCreate).
export async function createGPUInstanceType(params: {
  cluster_id: number;
  data: FormData;
}) {
  return request<ListItem>(GPU_INSTANCE_TYPES_API, {
    method: 'POST',
    params: { cluster_id: params.cluster_id },
    data: params.data,
    skipErrorHandler
  });
}

// DELETE /gpu-instance-types/{name}?cluster_id.
export async function deleteGPUInstanceType(params: {
  name: string;
  cluster_id: number;
}) {
  return request(`${GPU_INSTANCE_TYPES_API}/${params.name}`, {
    method: 'DELETE',
    params: { cluster_id: params.cluster_id },
    skipErrorHandler
  });
}

// PUT /gpu-instance-types/{name}/activate?cluster_id — activate an instance type.
export async function activateGPUInstanceType(params: {
  name: string;
  cluster_id: number;
}) {
  return request(`${GPU_INSTANCE_TYPES_API}/${params.name}/activate`, {
    method: 'PUT',
    params: { cluster_id: params.cluster_id },
    skipErrorHandler
  });
}

// PUT /gpu-instance-types/{name}/deactivate?cluster_id — deactivate an instance type.
export async function deactivateGPUInstanceType(params: {
  name: string;
  cluster_id: number;
}) {
  return request(`${GPU_INSTANCE_TYPES_API}/${params.name}/deactivate`, {
    method: 'PUT',
    params: { cluster_id: params.cluster_id },
    skipErrorHandler
  });
}
