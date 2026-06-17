import { ClusterListItem } from '@/pages/cluster-management/config/types';
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
    os_image: string;
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
  firstAddCluster: boolean;
  presetClusterType?: 'model' | 'gpu';
  // Provider to preselect when the create flow opens — set by the
  // empty-state CTA on feature pages that need a specific provider
  // (e.g. GPU Service can only schedule on Kubernetes, so its
  // "Add Cluster" button skips provider catalog and lands on the
  // K8s configure step). Consumed once by ClusterCreate on mount.
  providerHint?: string;
} | null>(null);

export const clusterDetailAtom = atom<ClusterListItem | null>(null);

export const workerAddedCountAtom = atom(0);
