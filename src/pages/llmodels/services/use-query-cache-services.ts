import { queryCacheProviders, queryCacheServices } from '@/pages/kv-cache/apis';
import { CacheProviderItem, ListItem } from '@/pages/kv-cache/config/types';
import { useQueryData } from '@gpustack/core-ui';
import { useState } from 'react';
import { backendOptionsMap } from '../constants/backend-parameters';

const RUNNING_STATE = 'running';

export interface CacheServiceOption {
  label: string;
  value: number;
  state: string;
  provider_name: string;
  mode: string;
  // only running services can be attached to a deployment
  disabled: boolean;
}

// providers are cluster-independent and the deployment modals are
// destroyOnHidden (a hook-local cache would refetch on every open), so a
// single in-flight catalog fetch is shared module-wide; a failure clears
// it so the next call retries
let providersPromise: Promise<CacheProviderItem[]> | null = null;
export const loadProviders = (): Promise<CacheProviderItem[]> => {
  let promise = providersPromise;
  if (!promise) {
    promise = queryCacheProviders({ page: -1 })
      .then((res) => res?.items || [])
      .catch((error) => {
        providersPromise = null;
        throw error;
      });
    providersPromise = promise;
  }
  return promise;
};

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
          mode: item.mode,
          disabled: item.state !== RUNNING_STATE
        }));
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
