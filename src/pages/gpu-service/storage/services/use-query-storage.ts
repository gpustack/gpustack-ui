import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrgNamespace } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { queryGPUServiceStorage } from '../apis';
import { ListItem } from '../config/types';

export default function useQueryStorage() {
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;
  // Admin "All" view has no Org context — fall back to the
  // selected cluster's owner Org name for the K8s namespace.
  const namespace = getCurrentOrgNamespace(currentCluster?.owner_principal_id);

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
