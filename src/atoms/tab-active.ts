import { getDefaultStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const tabActiveAtom = atomWithStorage<Map<string, any>>(
  'tabActiveStatus',
  new Map()
);

export const setActiveStatus = (key: string, value: any) => {
  const store = getDefaultStore();
  const cache = store.get(tabActiveAtom);
  cache.set(key, value);
  store.set(tabActiveAtom, cache);
};

export const getActiveStatus = (key: string) => {
  const store = getDefaultStore();
  const cache = store.get(tabActiveAtom);
  return cache.get(key);
};
