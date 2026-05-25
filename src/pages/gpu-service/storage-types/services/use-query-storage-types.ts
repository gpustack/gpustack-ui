import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServiceStorageTypes } from '../apis';
import { ListItem } from '../config/types';

export default function useQueryStorageTypes() {
  const fetchDetail = useCallback(
    (params: Global.SearchParams = { page: 1, perPage: 100 }, options?: any) =>
      queryGPUServiceStorageTypes(params, options),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.PageResponse<ListItem>,
    Global.SearchParams
  >({
    fetchDetail,
    key: 'storageTypes'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
