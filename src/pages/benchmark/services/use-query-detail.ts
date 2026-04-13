import { useQueryData } from '@gpustack/core-ui';
import { queryBenchmarkDetail } from '../apis';
import { BenchmarkDetail } from '../config/detail-types';

export default function useQueryBenchmarkDetail() {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<BenchmarkDetail>({
      fetchDetail: queryBenchmarkDetail,
      key: 'benchmarkDetail'
    });
  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
