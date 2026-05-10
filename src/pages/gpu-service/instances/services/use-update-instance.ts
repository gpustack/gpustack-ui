import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrganizationId } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { updateGPUServiceInstance } from '../apis';
import { FormData, ListItem } from '../config/types';

interface UpdateInstanceParams {
  id: number;
  data: FormData;
}

export default function useUpdateInstance() {
  const namespace = getCurrentOrganizationId();
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const fetchDetail = useCallback(
    (params: UpdateInstanceParams, option?: any) =>
      updateGPUServiceInstance(
        {
          namespace,
          clusterID,
          id: params.id,
          data: {
            apiVersion,
            kind: KindMapping.instance,
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
    UpdateInstanceParams
  >({
    fetchDetail,
    key: 'updateInstance'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
