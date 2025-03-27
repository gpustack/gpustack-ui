import useSetChunkRequest from '@/hooks/use-chunk-request';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { handleBatchRequest } from '@/utils';
import _ from 'lodash';
import qs from 'query-string';
import { useEffect, useRef, useState } from 'react';

export default function useTableFetch<ListItem>(options: {
  API?: string;
  watch?: boolean;
  fetchAPI: (params: any) => Promise<Global.PageResponse<ListItem>>;
  deleteAPI?: (id: number, params?: any) => Promise<any>;
  contentForDelete?: string;
}) {
  const { fetchAPI, deleteAPI, contentForDelete, API, watch } = options;
  const chunkRequedtRef = useRef<any>(null);
  const modalRef = useRef<any>(null);
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
  const [queryParams, setQueryParams] = useState<any>({
    page: 1,
    perPage: 10,
    search: ''
  });

  const { setChunkRequest } = useSetChunkRequest();
  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    events: ['UPDATE'],
    dataList: dataSource.dataList,
    setDataList(list, opts?: any) {
      setDataSource((pre) => {
        return {
          total: pre.total,
          loading: false,
          loadend: true,
          dataList: list,
          deletedIds: opts?.deletedIds || []
        };
      });
    }
  });

  const updateHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const createModelsChunkRequest = async (params?: any) => {
    if (!API || !watch) return;
    chunkRequedtRef.current?.current?.cancel?.();
    try {
      const query = _.omit(params || queryParams, ['page', 'perPage']);

      chunkRequedtRef.current = setChunkRequest({
        url: `${API}?${qs.stringify(_.pickBy(query, (val: any) => !!val))}`,
        handler: updateHandler
      });
    } catch (error) {
      // ignore
    }
  };

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

  const handleQueryChange = (params: any) => {
    setQueryParams({
      ...queryParams,
      ...params
    });
    fetchData({ query: { ...queryParams, ...params } });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    handleQueryChange({ page, perPage: pageSize || 10 });
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortOrder(sorter.order);
  };

  const handleSearch = () => {
    fetchData();
  };

  const debounceUpdateFilter = _.debounce((e: any) => {
    handleQueryChange({
      page: 1,
      search: e.target.value
    });
    createModelsChunkRequest({
      ...queryParams,
      search: e.target.value
    });
  }, 350);

  const handleNameChange = debounceUpdateFilter;

  const handleDelete = (
    row: ListItem & { name: string; id: number },
    options?: any
  ) => {
    modalRef.current.show({
      content: contentForDelete,
      operation: 'common.delete.single.confirm',
      name: row.name,
      ...options,
      async onOk() {
        console.log('OK');
        await deleteAPI?.(row.id, {
          ...modalRef.current?.configuration
        });
        fetchData();
      }
    });
  };

  const handleDeleteBatch = (options = {}) => {
    modalRef.current.show({
      content: contentForDelete,
      operation: 'common.delete.confirm',
      selection: true,
      ...options,
      async onOk() {
        if (!deleteAPI) return;
        await handleBatchRequest(rowSelection.selectedRowKeys, (id) =>
          deleteAPI(id, {
            ...modalRef.current?.configuration
          })
        );
        rowSelection.clearSelections();
        fetchData();
      }
    });
  };

  useEffect(() => {
    const init = async () => {
      await fetchData();
      setTimeout(() => {
        createModelsChunkRequest();
      }, 200);
    };
    init();
    return () => {
      chunkRequedtRef.current?.cancel?.();
      cacheDataListRef.current = [];
    };
  }, []);

  return {
    dataSource,
    rowSelection,
    sortOrder,
    queryParams,
    modalRef,
    setQueryParams,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleQueryChange,
    handleNameChange
  };
}
