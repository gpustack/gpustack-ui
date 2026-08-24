import type {
  InstanceTypeOption,
  OSImageOption,
  RegionOption
} from '@/pages/cluster-management/config/cloud-providers';
import { ClusterListItem } from '@/pages/cluster-management/config/types';
import { atom } from 'jotai';

// models expand keys: create, update , delete,
export const expandKeysAtom = atom<string[]>([]);

// The adapters' option types, rather than a copy of their fields: these lists
// hold exactly what `parseRegions` / `parseInstanceTypes` / `parseOSImages`
// produce, and a second declaration only drifts from them.
export const regionListAtom = atom<RegionOption[]>([]);

export const regionInstanceTypeListAtom = atom<InstanceTypeOption[]>([]);

export const regionOSImageListAtom = atom<OSImageOption[]>([]);

export const allRegionOSImageListAtom = atom<OSImageOption[]>([]);

export const allRegionInstanceTypeListAtom = atom<InstanceTypeOption[]>([]);

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
