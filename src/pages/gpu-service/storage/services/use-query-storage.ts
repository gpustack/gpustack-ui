import { currentClusterAtom } from '@/atoms/gpuservice';
import { useModel } from '@@/plugin-model';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { queryGPUServiceStorage } from '../apis';
import { ListItem } from '../config/types';

export default function useQueryStorage() {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';
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
