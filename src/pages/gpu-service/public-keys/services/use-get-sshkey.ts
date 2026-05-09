import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServicePublicKeys } from '../apis';
import { ListItem } from '../types';

export default function useGetSshkey() {
  const fetchDetail = useCallback(
    (params: {}, options?: any) => queryGPUServicePublicKeys(params, options),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<ListItem>({
      fetchDetail,
      key: 'sshkey'
    });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
