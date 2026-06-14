import { useQueryData } from '@/hooks/use-query-data-list';
import {
  queryStorageBreakdown,
  ResourceBreakdownResponse
} from '../../apis/resource';

export default function useQueryStorageBreakdown(option?: { key?: string }) {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<ResourceBreakdownResponse>({
      fetchDetail: queryStorageBreakdown,
      key: option?.key || 'storageBreakdown'
    });
  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
