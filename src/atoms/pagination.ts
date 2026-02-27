import { getDefaultStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface PaginationState {
  perPage: number;
}

export const paginationAtom = atomWithStorage<Record<string, any>>(
  'paginationStatus',
  {},
  undefined,
  { getOnInit: true }
);

export const getPaginationStatus = (key: string) => {
  if (!key) return {};
  const store = getDefaultStore();
  const cache = store.get(paginationAtom);
  return cache[key] || {};
};
