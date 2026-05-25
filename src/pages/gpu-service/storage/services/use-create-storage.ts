import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { createGPUServiceStorage } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateStorageParams {
  data: FormData;
}

export default function useCreateStorage() {
  const fetchDetail = useCallback(
    (params: CreateStorageParams) =>
      createGPUServiceStorage({ data: params.data }),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ListItem,
    CreateStorageParams
  >({
    fetchDetail,
    key: 'createStorage'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
