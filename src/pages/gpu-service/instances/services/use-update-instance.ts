import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { updateGPUServiceInstance } from '../apis';
import { FormData, ListItem } from '../config/types';

interface UpdateInstanceParams {
  id: number;
  data: Partial<FormData>;
}

export default function useUpdateInstance() {
  const fetchDetail = useCallback(
    (params: UpdateInstanceParams) =>
      updateGPUServiceInstance({ id: params.id, data: params.data }),
    []
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
