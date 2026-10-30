import { useQueryData } from '@gpustack/core-ui';
import { useMemoizedFn } from 'ahooks';
import { queryWorkerLabelOptions } from '../apis';
import { buildWorkerLabelOptions } from '../utils/worker-labels';

interface LabelOptionsQuery {
  cluster_id?: number;
}

interface LabelOptionsData {
  clusterId: number | null;
  options: Global.BaseOption<string>[];
}

export default function useWorkerLabelOptions(clusterId?: number) {
  const { detailData, loading, fetchData } = useQueryData<
    LabelOptionsData,
    LabelOptionsQuery
  >({
    key: 'worker-label-options',
    fetchDetail: async (query, options) => {
      const response = await queryWorkerLabelOptions(
        {
          ...(query.cluster_id == null ? {} : { cluster_id: query.cluster_id })
        },
        options
      );
      return {
        clusterId: query.cluster_id ?? null,
        options: buildWorkerLabelOptions(response)
      };
    }
  });

  const fetchLabelOptions = useMemoizedFn(async (scope: number | undefined) => {
    try {
      await fetchData({ cluster_id: scope });
    } catch {
      // The shared request handler reports errors and clears the cached detail.
    }
  });

  return {
    // A response from another cluster cannot supply the active dropdown.
    labelOptions:
      detailData.clusterId === (clusterId ?? null)
        ? detailData.options || []
        : [],
    labelOptionsLoading: loading,
    fetchLabelOptions
  };
}
