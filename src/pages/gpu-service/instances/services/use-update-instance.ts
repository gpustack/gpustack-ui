import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrgNamespace } from '@/atoms/user';
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
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;
  // Admin "All" view has no Org context — fall back to the
  // selected cluster's owner Org name for the K8s namespace.
  const namespace = getCurrentOrgNamespace(currentCluster?.owner_principal_id);

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
