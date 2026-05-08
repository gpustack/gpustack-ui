import { useModel } from '@@/plugin-model';
import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { updateGPUServiceStorage } from '../apis';
import { FormData, ListItem } from '../config/types';

interface UpdateStorageParams {
  id: number;
  data: FormData;
}

export default function useUpdateStorage() {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const fetchDetail = useCallback(
    (params: UpdateStorageParams, option?: any) =>
      updateGPUServiceStorage(
        {
          namespace,
          id: params.id,
          data: {
            apiVersion,
            kind: KindMapping.instancePersistentVolume,
            metadata: {
              name: params.data.metadata.name,
              namespace
            },
            spec: params.data.spec
          }
        },
        option
      ),
    [namespace]
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ListItem,
    UpdateStorageParams
  >({
    fetchDetail,
    key: 'updateStorage'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
