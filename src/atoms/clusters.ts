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
  }[]
>([]);

export const regionOSImageListAtom = atom<
  {
    label: string;
    value: string;
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
