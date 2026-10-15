import { queryCacheServices } from '@/pages/kv-cache/apis';
import { ListItem } from '@/pages/kv-cache/config/types';
import { loadProviders } from '@/pages/kv-cache/services/provider-catalog';
import { useQueryData } from '@gpustack/core-ui';
import { useState } from 'react';
import { backendOptionsMap } from '../constants/backend-parameters';

const RUNNING_STATE = 'running';

export interface CacheServiceOption {
  label: string;
  value: number;
  state: string;
  provider_name: string;
  // only running services can be attached to a deployment
  disabled: boolean;
}

const knownServices = new Map<string, CacheServiceOption>();
export const knownCacheService = (clusterId: number, serviceId: number) =>
  knownServices.get(`${clusterId}:${serviceId}`);

export { loadProviders };

export default function useQueryCacheServices() {
  const [cacheServiceOptions, setCacheServiceOptions] = useState<
    CacheServiceOption[]
  >([]);
  // supplies request cancellation: a newer fetch (cluster/backend switch)
  // cancels the in-flight one, so a slow response can never overwrite a
  // fresher list; detailData itself starts as {} and is normalized below
  const { loading, fetchData } = useQueryData<
    Global.PageResponse<ListItem>,
    Global.SearchParams
  >({
    key: 'cacheServices',
    fetchDetail: queryCacheServices
  });

  // resolves null on fetch failure or cancellation so callers can tell
  // "request failed" from "no services listed" and keep a saved
  // selection intact
  const fetchCacheServices = async (params: {
    clusterId?: number;
    backend?: string;
  }): Promise<CacheServiceOption[] | null> => {
    const { clusterId, backend = backendOptionsMap.vllm } = params;
    if (!clusterId) {
      setCacheServiceOptions([]);
      return [];
    }
    try {
      const [servicesRes, providers] = await Promise.all([
        fetchData({ page: -1, cluster_id: clusterId }),
        loadProviders()
      ]);
      // provider names declaring an integration for the given backend
      const compatibleProviders = new Set(
        providers
          .filter((provider) =>
            provider.inference_backend_integrations?.some(
              (item) => item.backend === backend
            )
          )
          .map((provider) => provider.name)
      );
      const options = (servicesRes?.items || [])
        .filter((item) => compatibleProviders.has(item.provider_name))
        .map((item) => ({
          label: item.name,
          value: item.id,
          state: item.state,
          provider_name: item.provider_name,
          disabled: item.state !== RUNNING_STATE
        }));
      options.forEach((option) => {
        knownServices.set(`${clusterId}:${option.value}`, option);
      });
      setCacheServiceOptions(options);
      return options;
    } catch (error) {
      // stale options from a previous cluster/backend must not stay
      // selectable (a superseding fetch repopulates right after)
      setCacheServiceOptions([]);
      return null;
    }
  };

  return {
    cacheServiceOptions,
    loading,
    fetchCacheServices
  };
}
