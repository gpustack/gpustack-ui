import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrgNamespace } from '@/atoms/user';
import { useQueryData } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { createGPUServiceInstance } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateInstanceParams {
  data: FormData;
}

export default function useCreateInstance() {
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;
  // Admin "All" view has no Org context — fall back to the
  // selected cluster's owner Org name for the K8s namespace.
  const namespace = getCurrentOrgNamespace(currentCluster?.owner_principal_id);

  const fetchDetail = useCallback(
    (params: CreateInstanceParams, option?: any) =>
      createGPUServiceInstance(
        {
          namespace,
          clusterID,
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
    CreateInstanceParams
  >({
    fetchDetail,
    key: 'createInstance'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
