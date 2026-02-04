import { request } from '@umijs/max';
import { FormData, RouteItem, RouteTarget } from '../config/types';

export const MODEL_ROUTES = '/model-routes';

export const MODEL_ROUTE_TARGETS = '/model-route-targets';

export async function queryModelRoutes(
  params: Global.SearchParams,
  options?: any
) {
  return request<Global.PageResponse<RouteItem>>(MODEL_ROUTES, {
    params,
    method: 'GET',
    cancelToken: options?.token
  });
}

export async function createModelRoute(params: { data: FormData }) {
  return request(`${MODEL_ROUTES}`, {
    method: 'POST',
    data: params.data
  });
}

export async function updateModelRoute(params: { id: number; data: FormData }) {
  return request(`${MODEL_ROUTES}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function deleteModelRoute(id: number) {
  return request(`${MODEL_ROUTES}/${id}`, {
    method: 'DELETE'
  });
}

export async function queryRouteTargets(
  params: { id?: number },
  options?: any
) {
  return request<Global.PageResponse<RouteTarget>>(`${MODEL_ROUTE_TARGETS}`, {
    method: 'GET',
    params: {
      route_id: params.id,
      page: -1
    },
    cancelToken: options?.token
  });
}

export async function deleteModelRouteTarget(id: number) {
  return request(`${MODEL_ROUTE_TARGETS}/${id}`, {
    method: 'DELETE'
  });
}

export async function updateModelRouteTarget(params: {
  id: number;
  data: Partial<RouteTarget>;
}) {
  return request(`${MODEL_ROUTE_TARGETS}/${params.id}`, {
    method: 'PUT',
    data: params.data
  });
}

export async function setRouteTargetAsFallback(params: {
  id: number;
  data: Partial<RouteTarget>;
}) {
  return request(`${MODEL_ROUTE_TARGETS}/${params.id}/set-fallback`, {
    method: 'POST',
    data: params.data
  });
}
