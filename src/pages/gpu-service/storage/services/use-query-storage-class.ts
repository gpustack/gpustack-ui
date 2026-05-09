import { currentClusterAtom } from '@/atoms/gpuservice';
import { useQueryDataList } from '@gpustack/core-ui';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { queryStorageClass } from '../apis';
import { StorageClassItem } from '../config/types';

export default function useQueryStorageClass() {
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const fetchList = useCallback(
    (params: Global.K8sSearchParams = {}, options?: any) =>
      queryStorageClass({ ...params, clusterID }, options),
    [clusterID]
  );

  const { dataList, loading, cancelRequest, fetchData } = useQueryDataList<
    StorageClassItem,
    Global.K8sSearchParams
  >({
    key: 'storageClass',
    fetchList,
    getLabel: (item) => item.metadata.name,
    getValue: (item) => item.metadata.name
  });

  return {
    storageClassList: dataList as Array<{ label: string; value: string }>,
    loading,
    cancelRequest,
    fetchData
  };
}
