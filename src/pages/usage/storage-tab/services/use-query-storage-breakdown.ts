import { useQueryData } from '@/hooks/use-query-data-list';
import {
  queryStorageBreakdown,
  ResourceBreakdownRequest,
  ResourceBreakdownResponse
} from '../../apis/resource';

/**
 * Wraps the `queryStorageBreakdown` request with shared loading state and
 * in-flight cancellation (previous request is cancelled on each new fetch and
 * on unmount), so rapid filter/page/sort changes can't race a stale response
 * onto the table.
 */
export default function useQueryStorageBreakdown(option?: { key?: string }) {
  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ResourceBreakdownResponse,
    ResourceBreakdownRequest
  >({
    fetchDetail: queryStorageBreakdown,
    key: option?.key || 'storageBreakdownTable'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
