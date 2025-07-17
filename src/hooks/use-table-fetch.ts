import useSetChunkRequest from '@/hooks/use-chunk-request';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { handleBatchRequest } from '@/utils';
import _ from 'lodash';
import qs from 'query-string';
import { useEffect, useRef, useState } from 'react';

type EventsType = 'CREATE' | 'UPDATE' | 'DELETE' | 'INSERT';

type WatchConfig =
  | { watch?: false | undefined; API?: string; polling?: boolean }
  | { watch: true; API: string; polling?: false | undefined }
  | { polling: true; watch: false | undefined; API?: string };

export default function useTableFetch<ListItem>(
  options: {
    fetchAPI: (params: any) => Promise<Global.PageResponse<ListItem>>;
    deleteAPI?: (id: number, params?: any) => Promise<any>;
    contentForDelete?: string;
    defaultData?: any[];
    events?: EventsType[];
  } & WatchConfig
) {
  const {
    fetchAPI,
    deleteAPI,
    contentForDelete,
    API,
    polling = false,
    watch,
    defaultData = [],
    events = ['UPDATE', 'DELETE']
  } = options;
  const pollingRef = useRef<any>(null);
  const chunkRequedtRef = useRef<any>(null);
  const modalRef = useRef<any>(null);
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [extraStatus, setExtraStatus] = useState<Record<string, any>>({
    firstLoad: true
  });

  const [dataSource, setDataSource] = useState<{
    dataList: ListItem[];
    loading: boolean;
    loadend: boolean;
    total: number;
    totalPage: number;
  }>({
    dataList: [...defaultData],
    loading: false,
    loadend: false,
    total: 0,
    totalPage: 0
  });
  const [queryParams, setQueryParams] = useState<any>({
    page: 1,
    perPage: 10,
    search: ''
  });

  const { setChunkRequest } = useSetChunkRequest();
  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    events: events,
    dataList: dataSource.dataList,
    setDataList(list, opts?: any) {
      setDataSource((pre) => {
        return {
          total: pre.total,
          totalPage: pre.totalPage,
          loading: false,
          loadend: true,
          dataList: list,
          deletedIds: opts?.deletedIds || []
        };
      });
    }
  });

  const debounceSetExtraStatus = _.debounce(setExtraStatus, 3000);

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

  const fetchData = async (params?: { query: any }, polling = false) => {
    if (!polling) {
      setDataSource((pre) => {
        pre.loading = true;
        return { ...pre };
      });
    }
    const { query } = params || {};
    try {
      const params = {
        ..._.pickBy(query || queryParams, (val: any) => !!val)
      };
      const res = await fetchAPI(params);

      if (
        !res.items.length &&
        params.page > res.pagination.totalPage &&
        res.pagination.totalPage > 0
      ) {
        const newParams = {
          ...params,
          page: res.pagination.totalPage
        };
        const newRes = await fetchAPI(newParams);
        setDataSource({
          dataList: newRes.items || [],
          loading: false,
          loadend: true,
          total: newRes.pagination.total,
          totalPage: newRes.pagination.totalPage
        });
        return;
      }

      setDataSource({
        dataList: res.items || [],
        loading: false,
        loadend: true,
        total: res.pagination.total,
        totalPage: res.pagination.totalPage
      });
    } catch (error) {
      console.log('error', error);
      setDataSource({
        dataList: [],
        loading: false,
        loadend: true,
        total: dataSource.total,
        totalPage: dataSource.totalPage
      });
    } finally {
      debounceSetExtraStatus({
        firstLoad: false
      });
    }
  };

  const fetchAPIWithPolling = async (params: any) => {
    if (!polling || watch || !fetchAPI) return;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // fetch data with polling, 1s interval
    pollingRef.current = setInterval(async () => {
      fetchData(
        {
          query: params
        },
        true
      );
    }, 5000);
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
    modalRef.current?.show({
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
    modalRef.current?.show({
      content: contentForDelete,
      operation: 'common.delete.confirm',
      selection: true,
      ...options,
      async onOk() {
        if (!deleteAPI) return;
        const successIds: any[] = [];
        const res = await handleBatchRequest(
          rowSelection.selectedRowKeys,
          async (id: any) => {
            await deleteAPI(id, {
              ...modalRef.current?.configuration
            });
            successIds.push(id);
          }
        );
        rowSelection.removeSelectedKeys(successIds);
        fetchData();
        return res;
      }
    });
  };

  useEffect(() => {
    if (dataSource.loadend) {
      fetchAPIWithPolling(queryParams);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [dataSource.loadend, queryParams]);

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
    extraStatus,
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
