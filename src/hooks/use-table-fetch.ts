import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import _ from 'lodash';
import { useEffect, useState } from 'react';

export default function useTableFetch<ListItem>(options: {
  fetchAPI: (params: any) => Promise<Global.PageResponse<ListItem>>;
}) {
  const { fetchAPI } = options;
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });

  const [dataSource, setDataSource] = useState<{
    dataList: ListItem[];
    loading: boolean;
    loadend: boolean;
    total: number;
  }>({
    dataList: [],
    loading: false,
    loadend: false,
    total: 0
  });
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    search: ''
  });

  const fetchData = async (params?: { query: any }) => {
    const { query } = params || {};
    setDataSource((pre) => {
      pre.loading = true;
      return { ...pre };
    });
    try {
      const params = {
        ..._.pickBy(query || queryParams, (val: any) => !!val)
      };
      const res = await fetchAPI(params);

      setDataSource({
        dataList: res.items || [],
        loading: false,
        loadend: true,
        total: res.pagination.total
      });
    } catch (error) {
      console.log('error', error);
      setDataSource({
        dataList: [],
        loading: false,
        loadend: true,
        total: dataSource.total
      });
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setQueryParams({
      ...queryParams,
      page: page,
      perPage: pageSize || 10
    });
    fetchData({ query: { ...queryParams, page, perPage: pageSize || 10 } });
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortOrder(sorter.order);
  };

  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      page: 1,
      search: e.target.value
    });

    fetchData({
      query: {
        ...queryParams,
        page: 1,
        search: e.target.value
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    dataSource,
    rowSelection,
    sortOrder,
    queryParams,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  };
}
