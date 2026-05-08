import { useModel } from '@@/plugin-model';
import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { apiVersion, KindMapping } from '../../constants';
import { createGPUServiceInstance } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateInstanceParams {
  data: FormData;
}

export default function useCreateInstance() {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const fetchDetail = useCallback(
    (params: CreateInstanceParams, option?: any) =>
      createGPUServiceInstance(
        {
          namespace,
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
