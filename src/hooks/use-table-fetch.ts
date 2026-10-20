import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import { handleBatchRequest } from '@/utils';
import {
  applyWatchChanges,
  createPaginatedWatchStream,
  reconcileWatchPage,
  recordWatchChanges,
  type WatchChanges
} from '@/utils/paginated-watch';
import {
  createAxiosToken,
  useChunkRequest,
  usePageVisibility,
  useTableMultiSort,
  useTableRowSelection,
  useUpdateChunkedList
} from '@gpustack/core-ui';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import qs from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { usePaginationStatus } from './use-pagination-status';

// polling cycel
const POLLING_CYCLE = 5000;

// Which query params are worth sending. `null` / `undefined` / `''` mean "this
// filter isn't set"; `false` and `0` are real filter values and must survive.
// The previous `!!val` test swallowed them, so a tri-state boolean filter set
// to its negative option silently behaved as "no filter at all" — the request
// went out without the param and the server returned everything.
//
// Deliberately NOT `!_.isEmpty(val)`: lodash treats every primitive except a
// non-empty string as empty, so that predicate would also drop `page`,
// `perPage` and every numeric filter.
const hasQueryValue = (val: any) =>
  val !== undefined && val !== null && val !== '';

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
    key?: (typeof PaginationKey)[keyof typeof PaginationKey];
    fetchAPI: (params: any, options?: any) => Promise<Global.PageResponse<T>>;
    deleteAPI?: (id: number, params?: any) => Promise<any>;
    afterDelete?: (id?: number | number[]) => void;
    contentForDelete?: string;
    defaultData?: any[];
    events?: EventsType[];
    defaultQueryParams?: Record<string, any>;
    isInfiniteScroll?: boolean;
    updateManually?: boolean;
    // set false when the caller already routes pause/resume by its own in-app
    // tab state, otherwise the listener here would revive an inactive tab
    pauseOnHidden?: boolean;
  } & WatchConfig
) {
  const {
    fetchAPI,
    deleteAPI,
    afterDelete,
    contentForDelete,
    API,
    polling = false,
    watch,
    defaultData = [],
    events = ['UPDATE', 'DELETE'],
    defaultQueryParams = {},
    isInfiniteScroll = false,
    updateManually,
    pauseOnHidden = true
  } = options;
  const pollingRef = useRef<any>(null);
  const chunkRequestRef = useRef<any>(null);
  const modalRef = useRef<any>(null);
  const rowSelection = useTableRowSelection();
  const { sortOrder, handleMultiSortChange } = useTableMultiSort();
  const axiosTokenRef = useRef<any>(null);
  const timerIDRef = useRef<any>(null);
  const hasInitRef = useRef(false);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const pendingWatchChangesRef = useRef<WatchChanges<T> | null>(null);
  const watchGenerationRef = useRef(0);
  const { pagination, setPagination } = usePaginationStatus(options.key || '');

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
    ...pagination,
    ...defaultQueryParams
  });
  const queryParamsRef = useRef(queryParams);

  const { setChunkRequest } = useChunkRequest();

  const { run: debounceSetExtraStatus } = useDebounceFn(setExtraStatus, {
    wait: 3000
  });

  useEffect(() => {
    queryParamsRef.current = queryParams;
  }, [queryParams]);

  const fetchData = useMemoizedFn(
    async (
      externalParams?: { query: Record<string, any>; loadmore?: boolean },
      polling = false
    ) => {
      const requestId = ++requestIdRef.current;
      const watchChanges: WatchChanges<T> = new Map();
      pendingWatchChangesRef.current = updateManually ? watchChanges : null;
      const isCurrentRequest = () =>
        mountedRef.current && requestId === requestIdRef.current;
      if (!polling) {
        setDataSource((pre) => {
          pre.loading = true;
          return { ...pre };
        });
      }
      const { query, loadmore } = externalParams || {};
      try {
        const params = {
          ..._.pickBy(query || queryParamsRef.current, hasQueryValue)
        };
        axiosTokenRef.current?.cancel?.('CANCEL_PREVIOUS_REQUEST');
        const axiosToken = createAxiosToken();
        axiosTokenRef.current = axiosToken;
        const res = await fetchAPI(params, {
          token: axiosToken.token
        });
        if (!isCurrentRequest()) return false;
        if (!dataSource.loadend) {
          // add a delay to avoid flash
          await new Promise((resolve) => {
            setTimeout(resolve, 200);
          });
        }
        if (!isCurrentRequest()) return false;
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
            token: axiosToken.token
          });

          if (!isCurrentRequest()) return false;
          const dataList = applyWatchChanges(
            loadmore
              ? [...cacheDataListRef.current, ...(newRes.items || [])]
              : newRes.items || [],
            watchChanges
          );
          cacheDataListRef.current = dataList;
          setDataSource({
            dataList,
            loading: false,
            loadend: true,
            total: newRes.pagination.total,
            totalPage: newRes.pagination.totalPage
          });

          queryParamsRef.current = newParams;
          setQueryParams(newParams);
          return true;
        }

        const dataList = applyWatchChanges(
          loadmore
            ? [...cacheDataListRef.current, ...(res.items || [])]
            : res.items || [],
          watchChanges
        );
        cacheDataListRef.current = dataList;
        setDataSource({
          dataList,
          loading: false,
          loadend: true,
          total: res.pagination.total,
          totalPage: res.pagination.totalPage
        });
        if (isInfiniteScroll && query?.page) {
          queryParamsRef.current = { ...queryParamsRef.current, ...query };
          setQueryParams(queryParamsRef.current);
        }
        return true;
      } catch (error: any) {
        if (isCurrentRequest() && error.message !== 'CANCEL_PREVIOUS_REQUEST') {
          cacheDataListRef.current = [];
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
        if (isCurrentRequest()) {
          pendingWatchChangesRef.current = null;
          debounceSetExtraStatus({ firstLoad: false });
        }
      }
    }
  );

  const { run: debounceFetchData, cancel: cancelDebouncedFetch } =
    useDebounceFn(
      () => fetchData({ query: { ...queryParamsRef.current } }, true),
      { wait: 1000, maxWait: 3000 }
    );

  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    limit: queryParams.perPage,
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

  const updateHandler = useMemoizedFn((list: any[]) => {
    if (!updateManually) {
      list.forEach(updateChunkedList);
      return;
    }

    // Watch reconnects replay ALL matching workers as CREATED, including rows
    // outside the current page, without distinguishing replay from new workers.
    // Only the paginated response determines this page's membership and order.
    // Passing these events to the shared CREATE merger would prepend off-page
    // rows and truncate the fetched page, even when isNewItem returns false:
    // that predicate only controls notification callbacks, not cache insertion.
    // Patch visible rows in place and coalesce a page refetch for unknown IDs
    // or deletions; never prepend CREATED rows or infer membership by timestamp.
    // Keep this policy local to the paginated table: useAddWorkerMessage uses
    // its own subscription and CREATE callbacks to count successful additions.
    // See src/hooks/__tests__/use-table-fetch.test.mts for replay and drawer cases.
    recordWatchChanges(pendingWatchChangesRef.current, list, events);
    const { dataList, needsRefresh, deletedIds } = reconcileWatchPage(
      cacheDataListRef.current,
      list,
      { events, sortBy: queryParamsRef.current.sort_by }
    );
    if (dataList !== cacheDataListRef.current) {
      cacheDataListRef.current = dataList;
      setDataSource((previous) => ({ ...previous, dataList, deletedIds }));
    }
    if (needsRefresh) debounceFetchData();
  });

  const cancelChunkRequest = () => {
    watchGenerationRef.current += 1;
    cancelDebouncedFetch();
    clearTimeout(timerIDRef.current);
    chunkRequestRef.current?.current?.cancel?.();
  };

  const createTableListChunkRequest = async (params?: any) => {
    if (!API || !watch) return;
    cancelChunkRequest();
    const generation = watchGenerationRef.current;
    try {
      const currentParams = params || queryParamsRef.current;

      const query = _.omit(currentParams, ['page', 'perPage', 'sort_by']);

      const isCurrentWatch = () =>
        mountedRef.current && generation === watchGenerationRef.current;
      const handler = (list: any[]) => {
        if (isCurrentWatch()) updateHandler(list);
      };
      const stream = updateManually
        ? createPaginatedWatchStream(handler, () => {
            if (isCurrentWatch()) {
              cancelDebouncedFetch();
              fetchData({ query: { ...queryParamsRef.current } }, true);
            }
          })
        : { handler };
      chunkRequestRef.current = setChunkRequest({
        // Match the REST filters exactly; page and sort belong to REST only.
        url: `${API}?${qs.stringify(_.pickBy(query, hasQueryValue))}`,
        ...stream
      });
    } catch (error) {
      // ignore
    }
  };

  // Release the long-lived work while the tab is hidden and rebuild it on the
  // way back. Chunked watches are capped per host (see MAX_WATCH_REQUESTS), and
  // a hidden tab's 5s polling burns the request budget we reserve for the
  // visible one.
  const cancelRequestsOnPageInactive = useMemoizedFn(() => {
    requestIdRef.current += 1;
    pendingWatchChangesRef.current = null;
    axiosTokenRef.current?.cancel?.();
    if (watch) {
      cancelChunkRequest();
      // DELETE events fired while we were not watching are never re-sent, so a
      // kept cache would resurrect deleted rows on the next watch event
      cacheDataListRef.current = [];
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  });

  const resumeRequestsOnPageActive = useMemoizedFn(async () => {
    // queryParamsRef, not queryParams: the current page/filters must survive
    const loaded = await fetchData(
      { query: { ...queryParamsRef.current } },
      true
    );
    if (!loaded) return;
    if (watch) {
      createTableListChunkRequest(queryParamsRef.current);
    } else {
      fetchAPIWithPolling(queryParamsRef.current);
    }
  });

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
      paginate?: boolean; // it's change for pagination
    }
  ) => {
    cancelDebouncedFetch();
    if (!options?.paginate) cancelChunkRequest();
    const generation = watchGenerationRef.current;
    const newQueryParams = { ...queryParamsRef.current, ...params };
    queryParamsRef.current = newQueryParams;
    setQueryParams(newQueryParams);
    const res = await fetchData({ query: newQueryParams });
    if (
      watch &&
      !options?.paginate &&
      res &&
      generation === watchGenerationRef.current
    ) {
      createTableListChunkRequest(newQueryParams);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    handleQueryChange({ page, perPage: pageSize || 10 }, { paginate: true });
    setPagination({
      perPage: pageSize || 10
    });
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
        ...queryParamsRef.current,
        page: 1,
        sort_by: sortKeys.join(',')
      };
      cancelDebouncedFetch();
      queryParamsRef.current = newQueryParams;
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

        // remove the deleted id from selected ids in row selection
        rowSelection.removeSelectedKeys([row.id]);
        afterDelete?.(row.id);
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
        afterDelete?.(successIds);
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

  usePageVisibility({
    // only the watch / polling configs hold work worth releasing
    enabled: pauseOnHidden && (!!watch || !!polling),
    onHidden: cancelRequestsOnPageInactive,
    onVisible: resumeRequestsOnPageActive
  });

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
      if (hasInitRef.current) return;
      hasInitRef.current = true;
      const loaded = await fetchData({
        query: { ...queryParamsRef.current, ...pagination }
      });
      if (!loaded) return;

      timerIDRef.current = setTimeout(() => {
        if (mountedRef.current) {
          createTableListChunkRequest();
        }
      }, 200);
    };

    init();
  }, [pagination?.perPage]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimeout(timerIDRef.current);
      requestIdRef.current += 1;
      pendingWatchChangesRef.current = null;
      cancelChunkRequest();
      axiosTokenRef.current?.cancel?.();
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
    cancelChunkRequest,
    createTableListChunkRequest,
    cancelRequestsOnPageInactive,
    resumeRequestsOnPageActive,
    handleNameChange
  };
}
