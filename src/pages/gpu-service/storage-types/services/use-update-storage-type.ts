import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { updateGPUServiceStorageType } from '../apis';
import { FormData, ListItem } from '../config/types';

interface UpdateStorageTypeParams {
  id: number;
  data: Omit<FormData, 'type' | 'name'>;
}

export default function useUpdateStorageType() {
  const fetchDetail = useCallback(
    (params: UpdateStorageTypeParams) =>
      updateGPUServiceStorageType({ id: params.id, data: params.data }),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ListItem,
    UpdateStorageTypeParams
  >({
    fetchDetail,
    key: 'updateStorageType'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
