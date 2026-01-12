import { DASHBOARD_API } from '@/pages/dashboard/apis';
import { request } from '@umijs/max';
import {
  ClusterFormData,
  ClusterListItem,
  CredentialFormData,
  CredentialListItem,
  NodePoolFormData,
  NodePoolListItem,
  SystemConfig
} from '../config/types';

export const CREDENTIALS_API = '/cloud-credentials';

export const CLUSTERS_API = '/clusters';

export const WORKER_POOLS_API = '/worker-pools';

export const CLUSTER_TOKEN = 'registration-token';

export const PROVIDER_PROXY_API = '/provider-proxy';

export const SYSTEM_CONFIG_API = '/config';

// ============= DigitalOcean start =====================

export const REGIONS_API = '/v2/regions';

export const INSTANCE_TYPE = '/v2/sizes';

export const OS_IMAGE = '/v2/images';

// ============= DigitalOcean end =======================

// ===================== Credentials =====================

export async function queryDigitalOceanRegions(params: { id: number }) {
  return request(
    `${CREDENTIALS_API}/${params.id}${PROVIDER_PROXY_API}${REGIONS_API}`,
    {
      method: 'GET',
      params: {
        per_page: 200
      }
    }
  );
}

export async function queryDigitalOceanInstanceTypes(params: { id: number }) {
  return request(
    `${CREDENTIALS_API}/${params.id}${PROVIDER_PROXY_API}${INSTANCE_TYPE}`,
    {
      method: 'GET',
      params: {
        per_page: 200
      }
    }
  );
}

export async function queryDigitalOceanOSImages(params: { id: number }) {
  return request(
    `${CREDENTIALS_API}/${params.id}${PROVIDER_PROXY_API}${OS_IMAGE}`,
    {
      method: 'GET',
      params: {
        per_page: 200,
        type: 'distribution'
      }
    }
  );
}

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

export async function queryClusterDetail(
  params: {
    cluster_id: number | string;
  },
  options?: any
) {
  return request(`${DASHBOARD_API}`, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function queryClusterItem(params: { id: number }, options?: any) {
  return request<ClusterListItem>(`${CLUSTERS_API}/${params.id}`, {
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function queryClusterToken(params: { id: number }) {
  return request(`${CLUSTERS_API}/${params.id}/${CLUSTER_TOKEN}`, {
    method: 'GET'
  });
}

// ===================== Worker Pools =====================

export async function queryWorkerPools(
  params?: Global.SearchParams & { cluster_id: string | number },
  options?: any
) {
  return request<Global.PageResponse<NodePoolListItem>>(
    `${WORKER_POOLS_API}?`,
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}

export async function createWorkerPool(params: {
  data: NodePoolFormData;
  clusterId: number | string;
}) {
  return request(`${CLUSTERS_API}/${params.clusterId}${WORKER_POOLS_API}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateWorkerPool(params: {
  id: number;
  data: NodePoolFormData;
}) {
  return request(`${WORKER_POOLS_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteWorkerPool(id: number) {
  return request(`${WORKER_POOLS_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function querySystemConfig() {
  return request<SystemConfig>(`${SYSTEM_CONFIG_API}`, {
    method: 'GET'
  });
}

export async function setDefaultCluster(params: { id: number }) {
  return request(`${CLUSTERS_API}/${params.id}/set-default`, {
    method: 'POST'
  });
}
