import { useQueryDataList } from '@gpustack/core-ui';
import { useCallback } from 'react';
import { queryGPUServicePublicKeys } from '../apis';
import { ListItem } from '../config/types';

export default function useQuerySshkeys() {
  const fetchList = useCallback(
    (params: Global.SearchParams = { page: 1, perPage: 100 }, options?: any) =>
      queryGPUServicePublicKeys(params, options),
    []
  );

  const { dataList, loading, cancelRequest, fetchData } = useQueryDataList<
    ListItem,
    Global.SearchParams
  >({
    key: 'sshkeyOptions',
    fetchList,
    getLabel: (item) => item?.name as string,
    getValue: (item) => item?.name as string
  });

  return {
    sshkeyOptions: dataList as Array<{ label: string; value: string }>,
    loading,
    cancelRequest,
    fetchData
  };
}
