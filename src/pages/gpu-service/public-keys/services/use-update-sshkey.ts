import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { updateGPUServicePublicKey } from '../apis';
import { FormData, ListItem } from '../config/types';

interface UpdateSshkeyParams {
  id: number;
  data: Omit<FormData, 'name'>;
}

export default function useUpdateSshkey() {
  const fetchDetail = useCallback(
    (params: UpdateSshkeyParams) =>
      updateGPUServicePublicKey({ id: params.id, data: params.data }),
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
