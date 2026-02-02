import { benchmarkTargetInstanceAtom } from '@/atoms/benchmark';
import { useNavigate } from '@umijs/max';
import { useAtom } from 'jotai';
import { ModelInstanceListItem } from '../config/types';

export const useBenchmarkTargetInstance = () => {
  const [benchmarkTargetInstance, setBenchmarkTargetInstance] = useAtom(
    benchmarkTargetInstanceAtom
  );
  const navigate = useNavigate();

  const runBenchmarkOnInstance = (instance: ModelInstanceListItem) => {
    setBenchmarkTargetInstance({
      cluster_id: instance.cluster_id,
      model_name: instance.model_name,
      model_id: instance.model_id,
      model_instance_name: instance.name,
      model_instance: [instance.model_name, instance.name]
    });
    navigate('/models/benchmark');
  };

  const clearBenchmarkTargetInstance = () => {
    setBenchmarkTargetInstance({
      cluster_id: null,
      model_name: '',
      model_id: null,
      model_instance_name: '',
      model_instance: []
    });
  };

  return {
    benchmarkTargetInstance,
    clearBenchmarkTargetInstance,
    runBenchmarkOnInstance
  };
};
