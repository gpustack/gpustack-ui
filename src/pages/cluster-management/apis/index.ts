import { DASHBOARD_API } from '@/pages/dashboard/apis';
import { request } from '@umijs/max';
import { ProviderType } from '../config';
import { getCloudProviderAdapter } from '../config/cloud-providers';
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

// ============= Cloud provider proxy =====================

// The path + query params of each list differ per provider, so they live in
// `config/cloud-providers.ts` (`cloudProviderAdapters`) next to the parsers
// for their payloads. These helpers only take care of the proxy call itself.

type CloudQueryParams = { id: number; provider?: ProviderType | string | null };

const requestProviderProxy = (
  credentialId: number,
  // Absent when the provider has no such list (Shuihua has no regions), which
  // is not an error: the caller gets an empty payload rather than a request to
  // a path that does not exist.
  endpoint?: { path: string; params?: Record<string, any> }
) => {
  if (!endpoint) {
    return Promise.resolve(undefined);
  }
  return request(
    `${CREDENTIALS_API}/${credentialId}${PROVIDER_PROXY_API}${endpoint.path}`,
    {
      method: 'GET',
      params: endpoint.params
    }
  );
};

export async function queryCloudRegions(params: CloudQueryParams) {
  const { proxy } = getCloudProviderAdapter(params.provider);
  return requestProviderProxy(params.id, proxy.regions);
}

export async function queryCloudInstanceTypes(params: CloudQueryParams) {
  const { proxy } = getCloudProviderAdapter(params.provider);
  return requestProviderProxy(params.id, proxy.instanceTypes);
}

export async function queryCloudOSImages(params: CloudQueryParams) {
  const { proxy } = getCloudProviderAdapter(params.provider);
  return requestProviderProxy(params.id, proxy.osImages);
}

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

export async function queryClusterList(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ClusterListItem>>(`${CLUSTERS_API}`, {
    method: 'GET',
    params,
    cancelToken: options?.token,
    skipErrorHandler: options?.skipErrorHandler
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

export async function queryClusterToken(
  params: { id: number },
  options?: {
    token?: any;
  }
) {
  return request(`${CLUSTERS_API}/${params.id}/${CLUSTER_TOKEN}`, {
    method: 'GET',
    cancelToken: options?.token
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
