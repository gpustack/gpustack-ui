import { useQueryDataList } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryStorageClass } from '../apis';
import { StorageClassItem } from '../config/types';

export default function useQueryStorageClass() {
  const fetchList = useCallback(
    (params: Global.SearchParams = { page: 1, perPage: 100 }, options?: any) =>
      queryStorageClass(params, options),
    []
  );

  const { dataList, loading, cancelRequest, fetchData } = useQueryDataList<
    StorageClassItem,
    Global.SearchParams
  >({
    key: 'storageClass',
    fetchList,
    getLabel: (item) => item?.displayName || item?.name,
    getValue: (item) => item?.name
  });

  return {
    storageClassList: dataList as Array<{ label: string; value: string }>,
    loading,
    cancelRequest,
    fetchData
  };
}
