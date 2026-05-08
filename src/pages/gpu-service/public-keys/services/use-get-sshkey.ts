import { useModel } from '@@/plugin-model';
import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServicePublicKeys } from '../apis';
import { ListItem } from '../types';

export default function useGetSshkey() {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const fetchDetail = useCallback(
    (params: Global.K8sSearchParams = {}, options?: any) =>
      queryGPUServicePublicKeys({ ...params, namespace }, options),
    [namespace]
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.K8sPageResponse<ListItem>,
    Global.K8sSearchParams
  >({
    fetchDetail,
    key: 'sshkey'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
