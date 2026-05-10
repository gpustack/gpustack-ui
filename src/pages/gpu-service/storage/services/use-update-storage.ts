import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrganizationId } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { updateGPUServiceStorage } from '../apis';
import { FormData, ListItem } from '../config/types';

interface UpdateStorageParams {
  id: number;
  data: FormData;
}

export default function useUpdateStorage() {
  const namespace = getCurrentOrganizationId();
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const fetchDetail = useCallback(
    (params: UpdateStorageParams, option?: any) =>
      updateGPUServiceStorage(
        {
          namespace,
          clusterID,
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
    [namespace, clusterID]
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
