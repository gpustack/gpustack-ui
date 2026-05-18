import { request } from '@umijs/max';
import _ from 'lodash';
import { omitPathParams } from '../../utils';
import {
  InstanceEvents,
  InstanceLog,
  InstanceLogQueryParams,
  InstanceTypeItem,
  ListItem
} from '../config/types';

export const GPU_SERVICE_INSTANCES_API = (params: {
  namespace: string;
  clusterID?: number;
}) =>
  `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instances`;

export const GPU_SERVICE_INSTANCES_TYPE_API = (params: {
  clusterID?: number;
}) => {
  return `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/instancetypes`;
};

export const GPU_SERVICE_INSTANCES_LOG_API = (params: {
  namespace: string;
  name: string;
  clusterID?: number;
}) => {
  return `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instances/${params.name}/log`;
};

export const GPU_SERVICE_INSTANCES_EVENTS_API = (params: {
  namespace: string;
  name: string;
  clusterID?: number;
}) => {
  return `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instances/${params.name}/events`;
};

export const GPU_SERVICE_INSTANCE_PV_EVENTS_API = (params: {
  namespace: string;
  name: string;
  clusterID?: number;
}) => {
  return `/clusters/${params.clusterID}/proxy/apis/worker.gpustack.ai/v1/namespaces/${params.namespace}/instancepersistentvolumes/${params.name}/events`;
};

// =========== Instances ===========

export async function queryGPUServiceInstances(
  params: Global.K8sSearchParams & {
    namespace: string;
    clusterID?: number;
  },
  options?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<Global.K8sPageResponse<ListItem>>(
    GPU_SERVICE_INSTANCES_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    }),
    {
      method: 'GET',
      params: omitPathParams(params),
      cancelToken: options?.token
    }
  );
}

export async function createGPUServiceInstance(
  params: {
    namespace: string;
    clusterID?: number;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<ListItem>(
    GPU_SERVICE_INSTANCES_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    }),
    {
      method: 'POST',
      data: params.data,
      cancelToken: option?.token
    }
  );
}

export async function updateGPUServiceInstance(
  params: {
    namespace: string;
    clusterID?: number;
    id: number;
    data: Global.K8sCommonData;
  },
  option?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<ListItem>(
    `${GPU_SERVICE_INSTANCES_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    })}/${params.data?.metadata?.name}`,
    {
      method: 'PUT',
      data: params.data,
      cancelToken: option?.token
    }
  );
}

export async function deleteGPUServiceInstance(
  params: {
    namespace: string;
    clusterID?: number;
    id: number;
  },
  option?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request(
    `${GPU_SERVICE_INSTANCES_API({
      namespace: params.namespace,
      clusterID: params.clusterID
    })}/${params.id}`,
    {
      method: 'DELETE',
      cancelToken: option?.token
    }
  );
}

// =========== Instance Types ===========

export async function queryGPUServiceInstanceTypes(
  params: Global.K8sSearchParams & { clusterID?: number },
  options?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<Global.K8sPageResponse<InstanceTypeItem>>(
    GPU_SERVICE_INSTANCES_TYPE_API({ clusterID: params.clusterID }),
    {
      method: 'GET',
      params: omitPathParams(params),
      cancelToken: options?.token
    }
  );
}

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
    `${GPU_SERVICE_INSTANCES_EVENTS_API({
      namespace: params.namespace,
      clusterID: params.clusterID,
      name: params.name
    })}`,
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
    `${GPU_SERVICE_INSTANCES_LOG_API({
      namespace: params.namespace,
      clusterID: params.clusterID,
      name: params.name
    })}`,
    {
      method: 'GET',
      params: omitPathParams(_.omit(params, ['name'])),
      cancelToken: options?.token
    }
  );
}

export async function queryGPUServiceInstanceTypeItems(
  params: {
    name: string;
    clusterID?: number;
  },
  options?: any
) {
  if (!params.clusterID) {
    return;
  }
  return request<InstanceTypeItem>(
    `${GPU_SERVICE_INSTANCES_TYPE_API({ clusterID: params.clusterID })}/${params.name}`,
    {
      method: 'GET',
      params: omitPathParams(params),
      cancelToken: options?.token
    }
  );
}
