import { atom, getDefaultStore } from 'jotai';

export const routeCacheAtom = atom<any>(new Map());

export const setRouteCache = (key: string, value: any) => {
  const store = getDefaultStore();
  const cache = store.get(routeCacheAtom);
  cache.set(key, value);
  store.set(routeCacheAtom, cache);
};

export const deleteRouteCache = (key: string) => {
  const store = getDefaultStore();
  const cache = store.get(routeCacheAtom);
  cache.delete(key);
  store.set(routeCacheAtom, cache);
};
