import { request } from '@umijs/max';
import type { ListItem } from '../../config/types';
import { queryHeaderMetadata, type HeaderMetadata } from './header-metadata';

interface CacheConfiguration {
  enabled?: boolean;
  mode?: string | null;
  cache_service_id?: number | null;
}
export interface CacheBinding {
  role: string | null;
  enabled: boolean | undefined;
  mode: string | null;
  serviceId: number | null;
}
export interface DeploymentMetadata extends HeaderMetadata {
  cacheServices: Record<number, { name: string; provider: string | null }>;
}

export const deploymentCacheBindings = (model: ListItem): CacheBinding[] => {
  const root = (model as ListItem & { extended_kv_cache?: CacheConfiguration })
    .extended_kv_cache;
  const configurations = model.roles?.length
    ? model.roles.map((role) => ({
        role: role.name,
        cache: (role.extended_kv_cache ?? root) as
          | CacheConfiguration
          | undefined
      }))
    : [{ role: null, cache: root }];
  return configurations.map(({ role, cache }) => ({
    role,
    enabled: cache?.enabled,
    // Existing deployments without a mode use local cache.
    mode: cache ? cache.mode || 'local' : null,
    serviceId:
      cache?.enabled &&
      cache.mode === 'shared' &&
      Number.isSafeInteger(cache.cache_service_id) &&
      cache.cache_service_id! > 0
        ? cache.cache_service_id!
        : null
  }));
};

export const queryDeploymentMetadata = async (
  model: ListItem,
  signal: AbortSignal
): Promise<DeploymentMetadata> => {
  const ids = [
    ...new Set(
      deploymentCacheBindings(model).flatMap((binding) =>
        binding.serviceId == null ? [] : [binding.serviceId]
      )
    )
  ];
  const [header, services] = await Promise.all([
    queryHeaderMetadata(model, signal),
    Promise.allSettled(
      ids.map((id) =>
        request<{
          id: number;
          cluster_id: number;
          name: string;
          provider_name?: string;
        }>(`/cache-services/${id}`, {
          method: 'GET',
          signal,
          skipErrorHandler: true
        })
      )
    )
  ]);
  const cacheServices: DeploymentMetadata['cacheServices'] = {};
  services.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const service = result.value;
    if (
      service.id !== ids[index] ||
      service.cluster_id !== model.cluster_id ||
      typeof service.name !== 'string'
    )
      return;
    cacheServices[service.id] = {
      name: service.name,
      provider:
        typeof service.provider_name === 'string' ? service.provider_name : null
    };
  });
  return { ...header, cacheServices };
};
