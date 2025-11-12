import { atom } from 'jotai';

// models expand keys: create, update , delete,
export const expandKeysAtom = atom<string[]>([]);

export const regionListAtom = atom<
  {
    datacenter: string;
    label: string;
    value: string;
    icon: string;
    sizes: string[];
  }[]
>([]);

export const regionInstanceTypeListAtom = atom<
  {
    label: string;
    value: string;
    description: string;
    specInfo: Record<string, any>;
    vendor: string;
    available: boolean;
    regions: string[];
  }[]
>([]);

export const regionOSImageListAtom = atom<
  {
    label: string;
    value: string;
    name: string;
    description: string;
    vendor: string;
    specInfo: Record<string, any>;
    regions: string[];
  }[]
>([]);

export const allRegionOSImageListAtom = atom<
  {
    label: string;
    value: string;
    regions: string[];
  }[]
>([]);

export const allRegionInstanceTypeListAtom = atom<
  {
    label: string;
    value: string;
    regions: string[];
  }[]
>([]);

export const fromClusterCreationAtom = atom(false);

/**
 * for temporary cluster session storage during creation/editing
 */
export const clusterSessionAtom = atom<{
  firstAddWorker: boolean;
} | null>(null);
