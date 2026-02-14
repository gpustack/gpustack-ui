import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useSetChunkRequest, {
  createAxiosToken
} from '@/hooks/use-chunk-request';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { handleBatchRequest } from '@/utils';
import _ from 'lodash';
import qs from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { useTableMultiSort } from './use-table-sort';

type EventsType = 'CREATE' | 'UPDATE' | 'DELETE' | 'INSERT';

type WatchConfig =
  | { watch?: false | undefined; API?: string; polling?: boolean }
  | { watch: true; API: string; polling?: false | undefined }
  | { polling: true; watch: false | undefined; API?: string };

/**
 *
 * @param contentForDelete i18n key for delete confirmation modal content
 * @param fetchAPI API function to fetch data, should return a promise with Global.PageResponse<T>
 * @param deleteAPI API function to delete an item, should return a promise
 * @param defaultData default data list
 * @param events events to watch for chunked updates, default: ['UPDATE', 'DELETE']
 * @param defaultQueryParams default query parameters for fetching data
 * @param isInfiniteScroll whether to use infinite scroll mode , use in card list
 * @param API use to create chunked request url when watch is true
 * @param watch whether to watch for chunked updates
 * @param polling whether to enable polling for data fetching
 * @returns
 */
export default function useTableFetch<T>(
  options: {
    fetchAPI: (params: any, options?: any) => Promise<Global.PageResponse<T>>;
    deleteAPI?: (id: number, params?: any) => Promise<any>;
    contentForDelete?: string;
    defaultData?: any[];
    events?: EventsType[];
    defaultQueryParams?: Record<string, any>;
    isInfiniteScroll?: boolean;
    updateManually?: boolean;
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
    events = ['UPDATE', 'DELETE'],
    defaultQueryParams = {},
    isInfiniteScroll = false,
    updateManually
  } = options;
  const pollingRef = useRef<any>(null);
  const chunkRequestRef = useRef<any>(null);
  const modalRef = useRef<any>(null);
  const rowSelection = useTableRowSelection();
  const { sortOrder, handleMultiSortChange } = useTableMultiSort();
  const axiosTokenRef = useRef<any>(null);
  const timerIDRef = useRef<any>(null);

  // for skeleton loading
  const [extraStatus, setExtraStatus] = useState<Record<string, any>>({
    firstLoad: true
  });

  const [dataSource, setDataSource] = useState<{
    dataList: T[];
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
    search: '',
    sort_by: '',
    ...defaultQueryParams
  });
  const queryParamsRef = useRef(queryParams);

  // for recognize the current watch trigger time, so that we can ignore the previous events
  const triggerAtRef = useRef<number>(0);

  const { setChunkRequest } = useSetChunkRequest();

  const debounceSetExtraStatus = _.debounce(setExtraStatus, 3000);

  useEffect(() => {
    queryParamsRef.current = queryParams;
  }, [queryParams]);

  const fetchData = async (
    externalParams?: { query: Record<string, any>; loadmore?: boolean },
    polling = false
  ) => {
    if (!polling) {
      setDataSource((pre) => {
        pre.loading = true;
        return { ...pre };
      });
    }
    const { query, loadmore } = externalParams || {};
    try {
      const params = {
        ..._.pickBy(query || queryParams, (val: any) => !!val)
      };
      axiosTokenRef.current?.cancel?.('CANCEL_PREVIOUS_REQUEST');
      axiosTokenRef.current = createAxiosToken();
      const res = await fetchAPI(params, {
        token: axiosTokenRef.current?.token
      });
      if (!dataSource.loadend) {
        // add a delay to avoid flash
        await new Promise((resolve) => {
          setTimeout(resolve, 200);
        });
      }
      if (
        !res.items.length &&
        params.page > res.pagination.totalPage &&
        res.pagination.totalPage > 0
      ) {
        const newParams = {
          ...params,
          page: res.pagination.totalPage
        };
        const newRes = await fetchAPI(newParams, {
          token: axiosTokenRef.current?.token
        });

        setDataSource({
          dataList: loadmore
            ? [...dataSource.dataList, ...(newRes.items || [])]
            : newRes.items || [],
          loading: false,
          loadend: true,
          total: newRes.pagination.total,
          totalPage: newRes.pagination.totalPage
        });

        if (isInfiniteScroll) {
          setQueryParams(newParams);
        }
        return true;
      }

      setDataSource({
        dataList: loadmore
          ? [...dataSource.dataList, ...(res.items || [])]
          : res.items || [],
        loading: false,
        loadend: true,
        total: res.pagination.total,
        totalPage: res.pagination.totalPage
      });
      if (isInfiniteScroll && query?.page) {
        setQueryParams({
          ...queryParams,
          ...query
        });
      }
      return true;
    } catch (error: any) {
      if (error.message !== 'CANCEL_PREVIOUS_REQUEST') {
        setDataSource({
          dataList: [],
          loading: false,
          loadend: true,
          total: dataSource.total,
          totalPage: dataSource.totalPage
        });
      }
      return false;
    } finally {
      debounceSetExtraStatus({
        firstLoad: false
      });
    }
  };

  // @ts-ignore for watch mode
  const debounceFetchData = _.debounce(
    () =>
      fetchData(
        {
          query: {
            ...queryParamsRef.current
          }
        },
        true
      ),
    1000
  );

  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    limit: queryParams.perPage,
    events: events,
    dataList: dataSource.dataList,
    triggerAt: updateManually ? triggerAtRef : undefined,
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
    },
    onCreate: (newItems: any) => {
      // ======= to resolve worker update issue =======
      if (updateManually && triggerAtRef.current && newItems.length > 0) {
        debounceFetchData();
      }
    },
    onDelete: (newItems: any) => {
      // ======= to resolve worker update issue =======
      if (updateManually && triggerAtRef.current && newItems.length > 0) {
        debounceFetchData();
      }
    }
  });

  const updateHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const createTableListChunkRequest = async (params?: any) => {
    if (!API || !watch) return;
    chunkRequestRef.current?.current?.cancel?.();
    try {
      const currentParams = params || queryParams;

      const query = _.omit(currentParams, ['page', 'perPage']);

      chunkRequestRef.current = setChunkRequest({
        url: `${API}?${qs.stringify(_.pickBy(query, (val: any) => !!val))}`,
        handler: updateHandler
      });
      triggerAtRef.current = Date.now();
    } catch (error) {
      // ignore
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

  // for filters change
  const handleQueryChange = async (
    params: any,
    options?: {
      paginate?: boolean;
    }
  ) => {
    // cancel previous chunk request so that we can create a new one with updated params
    chunkRequestRef.current?.current?.cancel?.();
    const newQueryParams = { ...queryParams, ...params };
    setQueryParams(newQueryParams);
    const res = await fetchData({ query: newQueryParams });
    if (watch && !options?.paginate && res) {
      createTableListChunkRequest(newQueryParams);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    handleQueryChange({ page, perPage: pageSize || 10 }, { paginate: true });
  };

  const handleTableChange = (
    pagination: any,
    filters: any,
    sorter: any,
    extra: any
  ) => {
    if (extra.action === 'sort') {
      const sortKeys = handleMultiSortChange(sorter);
      const newQueryParams = {
        ...queryParams,
        page: 1,
        sort_by: sortKeys.join(',')
      };
      setQueryParams(newQueryParams);
      fetchData({
        query: newQueryParams
      });
    }
  };

  // for refresh button
  const handleSearch = () => {
    fetchData();
  };

  const debounceUpdateFilter = _.debounce((e: any) => {
    handleQueryChange({
      page: 1,
      search: e.target.value
    });
  }, 350);

  const handleNameChange = debounceUpdateFilter;

  const handleDelete = (
    row: T & { name: string; id: number },
    options?: any
  ) => {
    modalRef.current?.show({
      content: contentForDelete,
      operation: 'common.delete.single.confirm',
      name: row.name,
      ...options,
      async onOk() {
        await deleteAPI?.(row.id, {
          ...modalRef.current?.configuration
        });

        // ======== to avoid fetch data twice, because of debounceFetchData has been run =======
        if (!updateManually) {
          fetchData();
        }
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

  const loadMore = (nextPage: number) => {
    fetchData({
      query: {
        ...queryParams,
        page: nextPage
      },
      loadmore: true
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
    let mounted = true;

    const init = async () => {
      await fetchData();

      timerIDRef.current = setTimeout(() => {
        if (mounted) {
          createTableListChunkRequest();
        }
      }, 200);
    };

    init();

    return () => {
      mounted = false;
      clearTimeout(timerIDRef.current);
      chunkRequestRef.current?.current?.cancel?.();
      axiosTokenRef.current?.cancel?.();
      cacheDataListRef.current = [];
      triggerAtRef.current = 0;
    };
  }, []);

  return {
    dataSource,
    rowSelection,
    sortOrder,
    queryParams,
    modalRef,
    extraStatus,
    TABLE_SORT_DIRECTIONS,
    debounceFetchData,
    setDataSource,
    setQueryParams,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleQueryChange,
    loadMore,
    handleNameChange
  };
}
