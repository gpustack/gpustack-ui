import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { updateGPUServicePublicKey } from '../apis';
import { FormData, ListItem } from '../types';

interface UpdateSshkeyParams {
  data: FormData;
}

export default function useUpdateSshkey() {
  const fetchDetail = useCallback(
    (params: UpdateSshkeyParams) =>
      updateGPUServicePublicKey({ data: params.data }),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    ListItem,
    UpdateSshkeyParams
  >({
    fetchDetail,
    key: 'updateSshkey'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
