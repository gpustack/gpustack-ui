import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrganizationId } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { queryGPUServiceInstanceLog } from '../apis';
import { InstanceLog, InstanceLogQueryParams } from '../config/types';

interface QueryInstanceLogParams extends InstanceLogQueryParams {
  name: string;
}

export default function useQueryInstanceLog() {
  const namespace = getCurrentOrganizationId();
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const fetchDetail = useCallback(
    (params: QueryInstanceLogParams, options?: any) =>
      queryGPUServiceInstanceLog(
        {
          ...params,
          namespace,
          clusterID
        },
        options
      ),
    [namespace, clusterID]
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    InstanceLog,
    QueryInstanceLogParams
  >({
    fetchDetail,
    key: 'instanceLog'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
