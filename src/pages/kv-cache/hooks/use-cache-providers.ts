import { localize } from '@/utils/localize';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { queryCacheProviders } from '../apis';
import { ServiceModeValueMap } from '../config';
import { CacheProviderItem, ServiceMode } from '../config/types';

// The option label is display text only; value stays the catalog name,
// so what a form submits does not move with the user's locale.
const toOption = (item: CacheProviderItem) => ({
  ...item,
  label: localize(item.display_name) || item.name,
  value: item.name
});

// The catalog is a read-only asset shipped with the release: one fetch
// serves every mount (list page, drawer form, and detail would otherwise
// each pull the full catalog). A failed fetch is not cached so the next
// mount retries.
let providersPromise: Promise<CacheProviderItem[]> | null = null;

const loadProviders = () => {
  if (!providersPromise) {
    providersPromise = queryCacheProviders({ page: -1 })
      .then((res) => res.items || [])
      .catch((error) => {
        providersPromise = null;
        throw error;
      });
  }
  return providersPromise;
};

const useCacheProviders = () => {
  const [providers, setProviders] = useState<CacheProviderItem[]>([]);

  useEffect(() => {
    let active = true;
    loadProviders()
      .then((items) => {
        if (active) {
          setProviders(items);
        }
      })
      .catch(() => {
        if (active) {
          setProviders([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const managedProviderOptions = useMemo(() => {
    return providers
      .filter((item) =>
        item.supported_modes?.includes(
          ServiceModeValueMap.Managed as ServiceMode
        )
      )
      .map(toOption);
  }, [providers]);

  const externalProviderOptions = useMemo(() => {
    return providers
      .filter((item) =>
        item.supported_modes?.includes(
          ServiceModeValueMap.External as ServiceMode
        )
      )
      .map(toOption);
  }, [providers]);

  const getProvider = useCallback(
    (name: string) => {
      return providers.find((item) => item.name === name);
    },
    [providers]
  );

  return {
    providers,
    managedProviderOptions,
    externalProviderOptions,
    getProvider
  };
};

export default useCacheProviders;
