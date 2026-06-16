import { useQueryData } from '@/hooks/use-query-data-list';
import {
  queryGpuInstancesBreakdown,
  ResourceBreakdownRequest,
  ResourceBreakdownResponse
} from '../../apis/resource';

/**
 * Wraps the `queryGpuInstancesBreakdown` request with shared loading state and
 * in-flight cancellation (the previous request is cancelled on each new fetch
 * and on unmount), so rapid filter/page/sort changes can't race a stale
 * response onto the chart or a table.
 */
export default function useQueryGpuInstancesBreakdown(option?: {
  key?: string;
}) {
  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ResourceBreakdownResponse,
    ResourceBreakdownRequest
  >({
    fetchDetail: queryGpuInstancesBreakdown,
    key: option?.key || 'gpuInstancesBreakdown'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
