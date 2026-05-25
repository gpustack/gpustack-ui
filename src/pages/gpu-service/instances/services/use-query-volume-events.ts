import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServiceInstancePVEvents } from '../apis';
import { InstanceEvents } from '../config/types';

interface QueryVolumeEventsParams {
  name: string;
  namespace: string;
  clusterID?: number;
}

export default function useQueryVolumeEvents() {
  const fetchDetail = useCallback(
    (params: QueryVolumeEventsParams, options?: any) =>
      queryGPUServiceInstancePVEvents(params, options),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    InstanceEvents,
    QueryVolumeEventsParams
  >({
    fetchDetail,
    key: 'volumeEvents'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
