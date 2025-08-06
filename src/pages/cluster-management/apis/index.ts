import { request } from '@umijs/max';
import {
  ClusterFormData,
  ClusterListItem,
  CredentialFormData,
  CredentialListItem,
  NodePoolFormData,
  NodePoolListItem
} from '../config/types';

export const CREDENTIALS_API = '/credentials';

export const CLUSTERS_API = '/clusters';

export const WORKER_POOLS_API = '/worker-pools';

export const CLUSTER_TOKEN = 'registration_token';

// ===================== Credentials =====================

export async function queryCredentialList(params: Global.SearchParams) {
  return request<Global.PageResponse<CredentialListItem>>(
    `${CREDENTIALS_API}`,
    {
      method: 'GET',
      params
    }
  );
}

export async function createCredential(params: { data: CredentialFormData }) {
  return request(`${CREDENTIALS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateCredential(params: {
  id: number;
  data: CredentialFormData;
}) {
  return request(`${CREDENTIALS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteCredential(id: number) {
  return request(`${CREDENTIALS_API}/${id}`, {
    method: 'DELETE'
  });
}

// ===================== Cluster =====================

export async function queryClusterList(params: Global.SearchParams) {
  return request<Global.PageResponse<ClusterListItem>>(`${CLUSTERS_API}`, {
    method: 'GET',
    params
  });
}

export async function createCluster(params: { data: ClusterFormData }) {
  return request(`${CLUSTERS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateCluster(params: {
  id: number;
  data: ClusterFormData;
}) {
  return request(`${CLUSTERS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteCluster(id: number) {
  return request(`${CLUSTERS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function queryClusterDetail(id: number) {
  return request(`${CLUSTERS_API}/${id}`, {
    method: 'GET'
  });
}

export async function queryClusterToken(id: number) {
  return request(`${CLUSTERS_API}/${id}/${CLUSTER_TOKEN}`, {
    method: 'GET'
  });
}

// ===================== Worker Pools =====================

export async function queryWorkerPools(
  clusterId: number,
  params?: Global.SearchParams
) {
  return request<Global.PageResponse<NodePoolListItem>>(
    `${CLUSTERS_API}/${clusterId}/${WORKER_POOLS_API}`,
    {
      method: 'GET',
      params
    }
  );
}

export async function createWorkerPool(
  clusterId: number,
  params: { data: NodePoolFormData }
) {
  return request(`${CLUSTERS_API}/${clusterId}/${WORKER_POOLS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateWorkerPool(
  clusterId: number,
  params: { id: number; data: NodePoolFormData }
) {
  return request(`/${WORKER_POOLS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteWorkerPool(clusterId: number, id: number) {
  return request(`/${WORKER_POOLS_API}/${id}`, {
    method: 'DELETE'
  });
}
