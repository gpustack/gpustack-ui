import { useQueryData } from '@/hooks/use-query-data-list';
import { queryUsageSummary, UsageSummaryResponse } from '../../apis/resource';

export default function useQueryUsageSummary(option?: { key?: string }) {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<UsageSummaryResponse>({
      fetchDetail: queryUsageSummary,
      key: option?.key || 'usageSummary'
    });
  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
