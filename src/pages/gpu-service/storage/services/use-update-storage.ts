import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { updateGPUServiceStorage } from '../apis';
import { ListItem, UpdateData } from '../config/types';

interface UpdateStorageParams {
  id: number;
  data: UpdateData;
}

export default function useUpdateStorage() {
  const fetchDetail = useCallback(
    (params: UpdateStorageParams) =>
      updateGPUServiceStorage({ id: params.id, data: params.data }),
    []
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
