import { DASHBOARD_API } from '@/pages/dashboard/apis';
import { request } from '@umijs/max';
import { ProviderType } from '../config';
import { getCloudProviderAdapter } from '../config/cloud-providers';
import {
  ClusterFormData,
  ClusterListItem,
  ClusterTopology,
  CredentialFormData,
  CredentialListItem,
  LocationAssignment,
  LocationsResponse,
  NodePoolFormData,
  NodePoolListItem,
  SystemConfig,
  TopologyView
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

/**
 * Safety valve for the pagination walk below: a provider that always answers
 * with a `next` link (misbehaving API, mocked payload) must not loop forever.
 * 20 pages x 200 items already covers any current list several times over,
 * and tripping the guard throws rather than silently returning a truncated
 * list — which would recreate the very bug this walk exists to fix.
 */
const PROVIDER_PROXY_MAX_PAGES = 20;

const requestProviderProxy = async (
  credentialId: number,
  // Absent when the provider has no such list (Shuihua has no regions), which
  // is not an error: the caller gets an empty payload rather than a request to
  // a path that does not exist.
  endpoint?: { path: string; params?: Record<string, any> }
) => {
  if (!endpoint) {
    return undefined;
  }
  const requestPage = (params?: Record<string, any>) =>
    request(
      `${CREDENTIALS_API}/${credentialId}${PROVIDER_PROXY_API}${endpoint.path}`,
      { method: 'GET', params }
    );

  let res = await requestPage(endpoint.params);

  // DigitalOcean paginates every list: items ride under one top-level array
  // key (`sizes` / `regions` / `images`) and `links.pages.next` is set while
  // pages remain. The API caps `per_page` at 200 while `/v2/sizes` holds 311
  // entries, so a single call stopped at the cap and the GPU sizes past it —
  // every one NYC2 offers — never reached the instance-type dropdown
  // (gpustack#6495). Providers without this envelope (Shuihua) take the early
  // return and behave exactly as before. `next` targets the provider host,
  // which the proxy refuses by design, so each follow-up re-issues the same
  // request with an incrementing `page` instead of following the link.
  const arrayKey = Object.keys(res || {}).find((key) =>
    Array.isArray(res[key])
  );
  if (!arrayKey || !res?.links?.pages?.next) {
    return res;
  }
  const merged = [...res[arrayKey]];
  let page = 2;
  // Walk until the provider stops linking a next page. A falsy follow-up
  // (empty body) or a malformed one (no array under the list key — an
  // error object, say) ends the walk on the last good response: its
  // envelope, `meta.total` included, is what the merged payload carries,
  // and adopting the malformed page's fields would drop that metadata.
  // Reaching the page guard with a `next` link still present fails
  // loudly: a silently truncated list is exactly the bug this walk
  // exists to fix.
  while (res?.links?.pages?.next) {
    if (page > PROVIDER_PROXY_MAX_PAGES) {
      throw new Error(
        `Provider proxy list ${endpoint.path} exceeded ${PROVIDER_PROXY_MAX_PAGES} pages`
      );
    }
    const next = await requestPage({ ...endpoint.params, page });
    if (!next || !Array.isArray(next[arrayKey])) {
      break;
    }
    merged.push(...next[arrayKey]);
    res = next;
    page++;
  }
  return { ...res, [arrayKey]: merged };
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

// ===================== Topology =====================

/** Everything the topology drawer paints on open, as the saved mapping sees it. */
export async function queryClusterTopology(
  params: { id: number },
  options?: any
) {
  return request<TopologyView>(`${CLUSTERS_API}/${params.id}/topology`, {
    method: 'GET',
    cancelToken: options?.token,
    skipErrorHandler: options?.skipErrorHandler
  });
}

/**
 * Fill in where workers sit. Writes the field's own label key on every worker
 * listed; `value: null` deletes it. The response carries the inverse
 * assignments, so undo is this same call with `previous` posted back as-is.
 */
export async function setTopologyLocations(params: {
  id: number;
  assignments: LocationAssignment[];
}) {
  return request<LocationsResponse>(
    `${CLUSTERS_API}/${params.id}/topology/locations`,
    {
      method: 'POST',
      data: { assignments: params.assignments },
      skipErrorHandler: true
    }
  );
}

/**
 * What an *unsaved* field-to-key mapping would make of this cluster's workers.
 *
 * A POST carrying the mapping, not a GET over the saved one, and that is the
 * point: the question is "does this key pick up our old labels", asked before
 * committing anything to a live cluster.
 */
export async function previewClusterTopology(params: {
  id: number;
  topology: ClusterTopology;
}) {
  return request<TopologyView>(
    `${CLUSTERS_API}/${params.id}/topology/preview`,
    {
      method: 'POST',
      data: { topology: params.topology },
      skipErrorHandler: true
    }
  );
}
