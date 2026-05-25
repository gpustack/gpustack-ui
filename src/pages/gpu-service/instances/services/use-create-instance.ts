import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { createGPUServiceInstance } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateInstanceParams {
  data: FormData;
}

export default function useCreateInstance() {
  const fetchDetail = useCallback(
    (params: CreateInstanceParams) =>
      createGPUServiceInstance({ data: params.data }),
    []
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
