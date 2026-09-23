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
    // A member of a group hands over its MODEL, not itself. Every member serves
    // an OpenAI-shaped API on its own port, so a run aimed at a prefill returns
    // 200 after a single token and a decode runs without the prefix its KV was
    // meant to carry — neither errors, and the report is of a request path no
    // user request takes. The group answers through its router, which the
    // server resolves; a member's own name would only be the wrong half of it.
    const member = !!instance.role;
    setBenchmarkTargetInstance({
      cluster_id: instance.cluster_id,
      model_name: instance.model_name,
      model_id: instance.model_id,
      model_instance_name: member ? '' : instance.name,
      model_instance: member
        ? [instance.model_name]
        : [instance.model_name, instance.name]
    });
    navigate('/models/benchmark');
  };

  // The entry a group is meant to be benchmarked from: a run measures a
  // deployment, and for a group that is the only correct target — its members
  // cannot answer a request on their own. It is also the better door for a
  // plain multi-replica model, where "benchmark one replica" was never the
  // question anyone was asking.
  const runBenchmarkOnModel = (model: {
    id: number;
    name: string;
    cluster_id: number;
  }) => {
    setBenchmarkTargetInstance({
      cluster_id: model.cluster_id,
      model_name: model.name,
      model_id: model.id,
      model_instance_name: '',
      model_instance: [model.name]
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
    runBenchmarkOnInstance,
    runBenchmarkOnModel
  };
};
