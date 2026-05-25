import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServiceInstanceLog } from '../apis';
import { InstanceLog, InstanceLogQueryParams } from '../config/types';

interface QueryInstanceLogParams extends InstanceLogQueryParams {
  name: string;
  namespace: string;
  clusterID?: number;
}

export default function useQueryInstanceLog() {
  const fetchDetail = useCallback(
    (params: QueryInstanceLogParams, options?: any) =>
      queryGPUServiceInstanceLog(params, options),
    []
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
