import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrganizationId } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { createGPUServiceStorage } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateStorageParams {
  data: FormData;
}

export default function useCreateStorage() {
  const namespace = getCurrentOrganizationId();
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const fetchDetail = useCallback(
    (params: CreateStorageParams, option?: any) =>
      createGPUServiceStorage(
        {
          namespace,
          clusterID,
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
    [namespace, clusterID]
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
