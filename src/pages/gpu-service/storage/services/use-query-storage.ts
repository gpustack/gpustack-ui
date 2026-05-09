import { useModel } from '@@/plugin-model';
import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServiceStorage } from '../apis';
import { ListItem } from '../config/types';

export default function useQueryStorage() {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const fetchDetail = useCallback(
    (params: Global.K8sSearchParams = {}, options?: any) =>
      queryGPUServiceStorage({ ...params, namespace }, options),
    [namespace]
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
