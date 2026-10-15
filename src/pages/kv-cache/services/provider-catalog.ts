import { queryCacheProviders } from '../apis';
import type { CacheProviderItem } from '../config/types';

// Share catalog requests across mounted forms. Saving a source invalidates the
// shared request and refreshes every consumer without reloading the browser.
let providersPromise: Promise<CacheProviderItem[]> | null = null;
const listeners = new Set<() => void>();

export const invalidateCacheProviders = () => {
  providersPromise = null;
  listeners.forEach((refresh) => refresh());
};

export const loadProviders = () => {
  if (!providersPromise) {
    const request = queryCacheProviders({ page: -1 })
      .then((res) => res.items || [])
      .catch((error) => {
        if (providersPromise === request) providersPromise = null;
        throw error;
      });
    providersPromise = request;
  }
  return providersPromise;
};

export const subscribeCacheProviders = (refresh: () => void) => {
  listeners.add(refresh);
  return () => {
    listeners.delete(refresh);
  };
};

// Source writes return before the backend rebuilds the catalog. These timers
// belong to the shared cache so leaving the source editor cannot cancel them.
let refreshTimers: ReturnType<typeof setTimeout>[] = [];

export const scheduleCacheProvidersRefresh = () => {
  refreshTimers.forEach(clearTimeout);
  refreshTimers = [1000, 3000].map((delay) =>
    setTimeout(invalidateCacheProviders, delay)
  );
};
