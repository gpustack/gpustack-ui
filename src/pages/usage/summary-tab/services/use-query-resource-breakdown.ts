import { useQueryData } from '@/hooks/use-query-data-list';
import {
  queryResourceBreakdown,
  ResourceBreakdownResponse
} from '../../apis/resource';

export default function useQueryResourceBreakdown(option?: { key?: string }) {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<ResourceBreakdownResponse>({
      fetchDetail: queryResourceBreakdown,
      key: option?.key || 'resourceBreakdown'
    });
  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
