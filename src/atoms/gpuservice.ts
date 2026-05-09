import { ClusterListItem } from '@/pages/cluster-management/config/types';
import { atom } from 'jotai';

export const currentClusterAtom = atom<
  (Partial<ClusterListItem> & { label?: string; value?: number }) | null
>(null);
