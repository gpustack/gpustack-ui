import { useModel } from '@@/plugin-model';
import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { createGPUServiceStorage } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateStorageParams {
  data: FormData;
}

export default function useCreateStorage() {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const fetchDetail = useCallback(
    (params: CreateStorageParams, option?: any) =>
      createGPUServiceStorage(
        {
          namespace,
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
    CreateStorageParams
  >({
    fetchDetail,
    key: 'createStorage'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
