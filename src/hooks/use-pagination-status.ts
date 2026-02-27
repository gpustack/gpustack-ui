import {
  getPaginationStatus,
  paginationAtom,
  PaginationState
} from '@/atoms/pagination';
import { useAtom } from 'jotai';

export const usePaginationStatus = (key: string) => {
  const [cache, setCache] = useAtom(paginationAtom);

  const value = cache[key] || {};

  const setPagination = (val: PaginationState) => {
    if (!key) return;

    setCache((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...val
      }
    }));
  };

  const getPagination = () => {
    return cache[key] || {};
  };

  const clearPagination = () => {
    if (!key) return;

    const newCache = { ...cache };
    delete newCache[key];
    setCache(newCache);
  };

  return {
    pagination: value,
    getPaginationStatus,
    setPagination,
    getPagination,
    clearPagination
  };
};
