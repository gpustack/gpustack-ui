import { atom } from 'jotai';

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
