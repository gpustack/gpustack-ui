import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServicePublicKeys } from '../apis';
import { ListItem } from '../config/types';

export default function useQueryPublicKeys() {
  const fetchDetail = useCallback(
    (params: Global.SearchParams = { page: 1, perPage: 100 }, options?: any) =>
      queryGPUServicePublicKeys(params, options),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.PageResponse<ListItem>,
    Global.SearchParams
  >({
    fetchDetail,
    key: 'publicKeys'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
