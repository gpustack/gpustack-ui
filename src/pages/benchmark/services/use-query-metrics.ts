import { useQueryData } from '@/hooks/use-query-data-list';
import { queryBenchmarkMetrics } from '../apis';
import { BenchmarkMetricsFormData } from '../config/detail-types';

export default function useQueryBenchmarkMetrics() {
  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    any,
    {
      id: number;
      data: BenchmarkMetricsFormData;
    }
  >({
    fetchDetail: queryBenchmarkMetrics,
    key: 'benchmarkMetrics'
  });
  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
