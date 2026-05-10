import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrganizationId } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { queryGPUServiceStorage } from '../apis';
import { ListItem } from '../config/types';

export default function useQueryStorage() {
  const namespace = getCurrentOrganizationId();
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const fetchDetail = useCallback(
    (params: Global.K8sSearchParams = {}, options?: any) =>
      queryGPUServiceStorage({ ...params, namespace, clusterID }, options),
    [namespace, clusterID]
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.K8sPageResponse<ListItem>,
    Global.K8sSearchParams
  >({
    fetchDetail,
    key: 'storage'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
