import { useModel } from '@@/plugin-model';
import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { updateGPUServicePublicKey } from '../apis';
import { ListItem } from '../types';

interface UpdateSshkeyParams {
  id: number;
  name: string;
  data: string;
}

export default function useUpdateSshkey() {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const fetchDetail = useCallback(
    (params: UpdateSshkeyParams) =>
      updateGPUServicePublicKey({
        namespace,
        id: params.id,
        data: {
          apiVersion,
          kind: KindMapping.sshPublicKey,
          metadata: {
            name: params.name,
            namespace
          },
          data: params.data
        }
      }),
    [namespace]
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ListItem,
    UpdateSshkeyParams
  >({
    fetchDetail,
    key: 'updateSshkey'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
