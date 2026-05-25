import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { createGPUServiceStorageType } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateStorageTypeParams {
  data: Omit<FormData, 'type'>;
}

export default function useCreateStorageType() {
  const fetchDetail = useCallback(
    (params: CreateStorageTypeParams) =>
      createGPUServiceStorageType({ data: params.data }),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ListItem,
    CreateStorageTypeParams
  >({
    fetchDetail,
    key: 'createStorageType'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
