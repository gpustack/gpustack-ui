import { useQueryData } from '@/hooks/use-query-data-list';
import { queryUsageTimeSeriesData } from '../apis';
import { TimeSeriesData } from '../config/types';

export default function useQueryTimeSeriesData() {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<TimeSeriesData>({
      fetchDetail: queryUsageTimeSeriesData,
      key: 'timeSeriesData'
    });
  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
