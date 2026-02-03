import { BackendOption } from '@/pages/llmodels/config/types';
import { atom, getDefaultStore } from 'jotai';

// models expand keys: create, update , delete,
export const modelsExpandKeysAtom = atom<string[]>([]);

export const modelsSessionAtom = atom<Record<string, any>>({});

export const requestIdAtom = atom<number>(0);

export const setRquestId = () => {
  const store = getDefaultStore();
  const id = Date.now();
  store.set(requestIdAtom, id);
  return id;
};

export const getRequestId = () => {
  const store = getDefaultStore();
  return store.get(requestIdAtom);
};

// store for cluster list: res.items from api
export const clusterListAtom = atom<
  {
    label: string;
    value: number;
    provider: string;
    state: string;
    is_default: boolean;
    workers: number;
    ready_workers: number;
    gpus: number;
  }[]
>([]);

// store for worker list: res.items from api
export const workerListAtom = atom<
  {
    label: string;
    value: number;
    cluster_id: number;
    state: string;
    id: number;
    labels: Record<string, any>;
    name: string;
  }[]
>([]);

export interface BackGroupOption {
  label: string;
  value: string;
  title?: string;
  options: BackendOption[];
}

export const backendOptionsAtom = atom<BackGroupOption[]>([]);

export const resourceOverviewAtom = atom<Record<string, any>>({});
