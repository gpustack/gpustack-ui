import {
  apiKeysTableDataAtom,
  modelsTableDataAtom,
  usersTableDataAtom
} from '@/atoms/usage';
import { useQueryDataList } from '@/hooks/use-query-data-list';
import { useSetAtom } from 'jotai';
import React from 'react';
import { queryUsageBreakdownList } from '../apis';
import { FilterOptionType, BreakdownItem as ListItem } from '../config/types';

export const useQueryBreakdownList = (options?: {
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
  key: 'modelsTableData' | 'usersTableData' | 'apiKeysTableData' | string;
}) => {
  const setApiKeysTableData = useSetAtom(apiKeysTableDataAtom);
  const setModelsTableData = useSetAtom(modelsTableDataAtom);
  const setUsersTableData = useSetAtom(usersTableDataAtom);
  const { key = 'usageBreakdownList' } = options || {};
  const [dataSource, setDataSource] = React.useState<{
    loadend: boolean;
    dataList: ListItem[];
    total: number;
  }>({
    total: 0,
    loadend: false,
    dataList: []
  });
  const { dataList, loading, fetchData, cancelRequest } = useQueryDataList<
    ListItem,
    Global.SearchParams & {
      filters: {
        models?: FilterOptionType[];
        users?: FilterOptionType[];
        api_keys?: FilterOptionType[];
      };
    },
    Global.PageResponse<ListItem>
  >({
    key: key,
    responseType: 'object',
    fetchList: queryUsageBreakdownList
  });

  const fetchListData = async (
    params: Global.SearchParams & {
      filters: {
        models?: FilterOptionType[];
        users?: FilterOptionType[];
        api_keys?: FilterOptionType[];
      };
    }
  ) => {
    const res = await fetchData(params);
    setDataSource({
      dataList: res.items || [],
      loadend: true,
      total: res.pagination?.total || 0
    });
    if (key === 'apiKeysTableData') {
      setApiKeysTableData({
        dataList: res.items || [],
        loadend: true,
        total: res.pagination?.total || 0
      });
    }
    if (key === 'modelsTableData') {
      setModelsTableData({
        dataList: res.items || [],
        loadend: true,
        total: res.pagination?.total || 0
      });
    }
    if (key === 'usersTableData') {
      setUsersTableData({
        dataList: res.items || [],
        loadend: true,
        total: res.pagination?.total || 0
      });
    }
  };

  return {
    dataList,
    dataSource,
    loading,
    fetchData: fetchListData,
    cancelRequest
  };
};

export default useQueryBreakdownList;
