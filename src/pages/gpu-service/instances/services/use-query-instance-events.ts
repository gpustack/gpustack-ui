import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrgNamespace } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { queryGPUServiceInstanceEvents } from '../apis';
import { InstanceEvents } from '../config/types';

interface QueryInstanceEventsParams {
  name: string;
  pretty?: string;
}

export default function useQueryInstanceEvents() {
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;
  const namespace = getCurrentOrgNamespace(currentCluster?.owner_principal_id);

  const fetchDetail = useCallback(
    (params: QueryInstanceEventsParams, options?: any) =>
      queryGPUServiceInstanceEvents(
        {
          namespace,
          clusterID,
          name: params.name,
          pretty: params.pretty
        },
        options
      ),
    [namespace, clusterID]
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
