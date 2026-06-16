import { useQueryData } from '@/hooks/use-query-data-list';
import {
  queryResourceEvents,
  ResourceEventsResponse
} from '../../apis/resource';

type ResourceEventsParams = Parameters<typeof queryResourceEvents>[0];

/**
 * Wraps the `queryResourceEvents` request with shared loading state and
 * in-flight cancellation (the previous request is cancelled on each new fetch
 * and on unmount), so rapid filter/name-search/page changes can't race a stale
 * response onto the table.
 */
export default function useQueryResourceEvents(option?: { key?: string }) {
  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ResourceEventsResponse,
    ResourceEventsParams
  >({
    fetchDetail: queryResourceEvents,
    key: option?.key || 'resourceEvents'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
