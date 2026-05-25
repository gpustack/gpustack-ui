import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { createGPUServicePublicKey } from '../apis';
import { FormData, ListItem } from '../config/types';

interface CreateSshkeyParams {
  data: FormData;
}

export default function useCreateSshkey() {
  const fetchDetail = useCallback(
    (params: CreateSshkeyParams) =>
      createGPUServicePublicKey({ data: params.data }),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ListItem,
    CreateSshkeyParams
  >({
    fetchDetail,
    key: 'createSshkey'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
