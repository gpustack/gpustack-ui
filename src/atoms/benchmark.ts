import { BenchmarkListItem } from '@/pages/benchmark/config/types';
import { atom } from 'jotai';

// Hand-off for "clone this run" raised outside the list page (the detail page
// has no create drawer of its own). The list page consumes it on mount, opens
// the create drawer pre-filled, and clears it.
export const benchmarkCloneSourceAtom = atom<BenchmarkListItem | null>(null);

export const benchmarkTargetInstanceAtom = atom<{
  cluster_id: number | null;
  model_name: string;
  model_id: number | null;
  model_instance_name: string;
  model_instance: string[];
}>({
  cluster_id: null,
  model_name: '',
  model_id: null,
  model_instance_name: '',
  model_instance: []
});
