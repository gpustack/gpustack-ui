import { localize } from '@/utils/localize';
import { useMemoizedFn } from 'ahooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CacheProviderItem } from '../config/types';
import {
  loadProviders,
  subscribeCacheProviders
} from '../services/provider-catalog';

// The option label is display text only; value stays the catalog name,
// so what a form submits does not move with the user's locale.
const toOption = (item: CacheProviderItem) => ({
  ...item,
  label: localize(item.display_name) || item.name,
  value: item.name
});

const useCacheProviders = (options?: { onLoaded?: () => void }) => {
  const [providers, setProviders] = useState<CacheProviderItem[]>([]);
  const onLoaded = useMemoizedFn(() => options?.onLoaded?.());

  useEffect(() => {
    let generation = 0;
    const refresh = () => {
      const current = ++generation;
      loadProviders()
        .then((items) => {
          if (current === generation) {
            setProviders(items);
            onLoaded();
          }
        })
        .catch(() => {
          if (current === generation) setProviders([]);
        });
    };
    const unsubscribe = subscribeCacheProviders(refresh);
    refresh();
    return () => {
      generation++;
      unsubscribe();
    };
  }, []);

  const providerOptions = useMemo(() => {
    return providers.map(toOption);
  }, [providers]);

  const getProvider = useCallback(
    (name: string) => {
      return providers.find((item) => item.name === name);
    },
    [providers]
  );

  return {
    providers,
    providerOptions,
    getProvider
  };
};

export default useCacheProviders;
