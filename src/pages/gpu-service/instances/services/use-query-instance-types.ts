import { useQueryData } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServiceInstanceTypes } from '../apis';
import { InstanceTypeItem } from '../config/types';

export default function useQueryInstanceTypes() {
  const fetchDetail = useCallback(
    (params: Global.SearchParams = { page: 1, perPage: 100 }, options?: any) =>
      queryGPUServiceInstanceTypes(params, options),
    []
  );

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.PageResponse<InstanceTypeItem>,
    Global.SearchParams
  >({
    fetchDetail,
    key: 'instanceTypes'
  });

  return {
    detailData,
    loading,
    cancelRequest,
    fetchData
  };
}
