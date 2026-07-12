import { request } from '@umijs/max';
import _ from 'lodash';
import { omitPathParams } from '../../utils';
import {
  FormData,
  InstanceEvents,
  InstanceLog,
  InstanceLogQueryParams,
  InstanceTypeItem,
  ListItem
} from '../config/types';

export const GPU_SERVICE_INSTANCES_API = '/gpu-instances';

export const GPU_SERVICE_INSTANCES_TYPE_API = '/gpu-instance-types/aggregated';

// View logs / events still go through the K8s proxy until the /v2
// /gpu-instances API exposes equivalents. clusterID and namespace come
// per-row from `row.clusterId` and `row.status.namespace`.

export const GPU_SERVICE_INSTANCES_LOG_API = (params: {
  namespace: string;
  name: string;
  clusterID?: number;
}) =>
  `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instances/${params.name}/log`;

export const GPU_SERVICE_INSTANCES_EVENTS_API = (params: {
  namespace: string;
  name: string;
  clusterID?: number;
}) =>
  `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instances/${params.name}/events`;

export const GPU_SERVICE_INSTANCE_PV_EVENTS_API = (params: {
  namespace: string;
  name: string;
  clusterID?: number;
}) =>
  `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instancepersistentvolumes/${params.name}/events`;

// =========== Instances ===========

export async function queryGPUServiceInstances(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<ListItem>>(GPU_SERVICE_INSTANCES_API, {
    method: 'GET',
    params,
    cancelToken: options?.token
  });
}

export async function createGPUServiceInstance(params: { data: FormData }) {
  return request<ListItem>(GPU_SERVICE_INSTANCES_API, {
    method: 'POST',
    data: params.data
  });
}

export async function updateGPUServiceInstance(params: {
  id: number;
  data: Partial<FormData>;
}) {
  return request<ListItem>(`${GPU_SERVICE_INSTANCES_API}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteGPUServiceInstance(id: number) {
  return request(`${GPU_SERVICE_INSTANCES_API}/${id}`, {
    method: 'DELETE'
  });
}

export async function stopGPUServiceInstance(id: number) {
  return request(`${GPU_SERVICE_INSTANCES_API}/${id}/stop`, {
    method: 'PUT'
  });
}

export async function startGPUServiceInstance(id: number) {
  return request(`${GPU_SERVICE_INSTANCES_API}/${id}/start`, {
    method: 'PUT'
  });
}

// =========== Instance Types ===========

export async function queryGPUServiceInstanceTypes(
  params: Global.SearchParams = { page: 1, perPage: 100 },
  options?: any
) {
  return request<Global.PageResponse<InstanceTypeItem>>(
    GPU_SERVICE_INSTANCES_TYPE_API,
    {
      method: 'GET',
      params,
      cancelToken: options?.token
    }
  );
}

// =========== Logs / Events (K8s proxy) ===========

export async function queryGPUServiceInstanceEvents(
  params: {
    namespace: string;
    name: string;
    clusterID?: number;
    pretty?: string;
  },
  options?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<InstanceEvents>(
    GPU_SERVICE_INSTANCES_EVENTS_API({
      namespace: params.namespace,
      clusterID: params.clusterID,
      name: params.name
    }),
    {
      method: 'GET',
      params: omitPathParams(_.omit(params, ['name'])),
      cancelToken: options?.token
    }
  );
}

export async function queryGPUServiceInstancePVEvents(
  params: {
    namespace: string;
    name: string;
    clusterID?: number;
  },
  options?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<InstanceEvents>(
    GPU_SERVICE_INSTANCE_PV_EVENTS_API({
      namespace: params.namespace,
      clusterID: params.clusterID,
      name: params.name
    }),
    {
      method: 'GET',
      params: omitPathParams(_.omit(params, ['name'])),
      cancelToken: options?.token
    }
  );
}

export async function queryGPUServiceInstanceLog(
  params: InstanceLogQueryParams & {
    namespace: string;
    name: string;
    clusterID?: number;
  },
  options?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<InstanceLog>(
    GPU_SERVICE_INSTANCES_LOG_API({
      namespace: params.namespace,
      clusterID: params.clusterID,
      name: params.name
    }),
    {
      method: 'GET',
      params: omitPathParams(_.omit(params, ['name'])),
      cancelToken: options?.token
    }
  );
}
