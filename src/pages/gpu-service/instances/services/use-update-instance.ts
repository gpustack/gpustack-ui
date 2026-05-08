import { useModel } from '@@/plugin-model';
import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { updateGPUServiceInstance } from '../apis';
import { FormData, ListItem } from '../config/types';

interface UpdateInstanceParams {
  id: number;
  data: FormData;
}

export default function useUpdateInstance() {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const fetchDetail = useCallback(
    (params: UpdateInstanceParams, option?: any) =>
      updateGPUServiceInstance(
        {
          namespace,
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
    [namespace]
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
