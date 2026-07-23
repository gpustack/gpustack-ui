import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { createGPUInstanceType } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateInstanceTypeParams {
  cluster_id: number;
  data: FormData;
}

export default function useCreateInstanceType() {
  const fetchDetail = useCallback(
    (params: CreateInstanceTypeParams) =>
      createGPUInstanceType({
        cluster_id: params.cluster_id,
        data: params.data
      }),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ListItem,
    CreateInstanceTypeParams
  >({
    fetchDetail,
    key: 'createInstanceType'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
