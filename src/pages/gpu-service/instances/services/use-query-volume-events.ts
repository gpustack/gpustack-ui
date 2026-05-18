import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrgNamespace } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { queryGPUServiceInstancePVEvents } from '../apis';
import { InstanceEvents } from '../config/types';

interface QueryVolumeEventsParams {
  name: string;
  pretty?: string;
}

export default function useQueryVolumeEvents() {
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;
  const namespace = getCurrentOrgNamespace(currentCluster?.owner_principal_id);

  const fetchDetail = useCallback(
    (params: QueryVolumeEventsParams, options?: any) =>
      queryGPUServiceInstancePVEvents(
        {
          namespace,
          clusterID,
          name: params.name
        },
        options
      ),
    [namespace, clusterID]
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
