import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServiceInstanceEvents } from '../apis';
import { InstanceEvents } from '../config/types';

interface QueryInstanceEventsParams {
  name: string;
  namespace: string;
  clusterID?: number;
  pretty?: string;
}

export default function useQueryInstanceEvents() {
  const fetchDetail = useCallback(
    (params: QueryInstanceEventsParams, options?: any) =>
      queryGPUServiceInstanceEvents(params, options),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    InstanceEvents,
    QueryInstanceEventsParams
  >({
    fetchDetail,
    key: 'instanceEvents'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
