import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServiceStorage } from '../apis';
import { ListItem } from '../config/types';

export default function useQueryStorage() {
  const fetchDetail = useCallback(
    (params: Global.SearchParams = { page: 1, perPage: 100 }, options?: any) =>
      queryGPUServiceStorage(params, options),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.PageResponse<ListItem>,
    Global.SearchParams
  >({
    fetchDetail,
    key: 'storage'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
