import { currentClusterAtom } from '@/atoms/gpuservice';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { queryGPUServiceInstanceTypes } from '../apis';
import { transformInstanceType } from '../config';
import { InstanceTypeItem } from '../config/types';

export default function useQueryInstanceTypes() {
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const fetchDetail = useCallback(
    async (params: Global.K8sSearchParams = {}, options?: any) => {
      const res = await queryGPUServiceInstanceTypes(
        { ...params, clusterID },
        options
      );
      return {
        ...res,
        items: (res?.items || []).map(transformInstanceType)
      };
    },
    [clusterID]
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.K8sPageResponse<InstanceTypeItem>,
    Global.K8sSearchParams
  >({
    fetchDetail,
    key: 'instanceTypes'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
