import TableContext from '@/components/seal-table/table-context';
import { TableOrder } from '@/components/seal-table/types';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import { useTableMultiSort } from '@/hooks/use-table-sort';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import qs from 'query-string';
import React, { useEffect, useRef, useState } from 'react';
import {
  MODELS_API,
  MODEL_INSTANCE_API,
  queryModelsInstances,
  queryModelsList
} from './apis';
import TableList from './components/table-list';
import { ListItem } from './config/types';

const Models: React.FC<{ clusterId?: number }> = ({ clusterId }) => {
  const { sortOrder, handleMultiSortChange } = useTableMultiSort();
  const { setChunkRequest, createAxiosToken } = useSetChunkRequest();
  const { setChunkRequest: setModelInstanceChunkRequest } =
    useSetChunkRequest();
  const [modelInstances, setModelInstances] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<{
    dataList: ListItem[];
    deletedIds: number[];
    loading: boolean;
    loadend: boolean;
    total: number;
  }>({
    dataList: [],
    deletedIds: [],
    loading: false,
    loadend: false,
    total: 0
  });
  const chunkRequedtRef = useRef<any>();
  const chunkInstanceRequedtRef = useRef<any>();
  const isPageHidden = useRef(false);
  const instancesToken = useRef<any>();
  let axiosToken = createAxiosToken();
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    search: '',
    cluster_id: clusterId || 0,
    categories: [],
    state: '',
    sort_by: ''
  });

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

  const {
    updateChunkedList: updateInstanceChunkedList,
    cacheDataListRef: cacheInsDataListRef
  } = useUpdateChunkedList({
    dataList: modelInstances,
    limit: 100,
    setDataList: setModelInstances
  });

  const getAllModelInstances = useMemoizedFn(async () => {
    try {
      instancesToken.current?.cancel?.();
      instancesToken.current = createAxiosToken();
      const params = {
        page: -1
      };
      const res: any = await queryModelsInstances(params, {
        token: instancesToken.current.token
      });
      cacheInsDataListRef.current = res.items || [];
      setModelInstances(res.items || []);
    } catch (error) {
      // ignore
    }
  });

  const fetchData = useMemoizedFn(
    async (params?: {
      loadingVal?: boolean;
      query?: {
        page: number;
        perPage: number;
        search: string;
        categories: any[];
        sort_by: string;
      };
    }) => {
      const { loadingVal, query } = params || {};
      axiosToken?.cancel?.();
      axiosToken = createAxiosToken();
      setDataSource((pre) => {
        pre.loading = loadingVal ?? true;
        return { ...pre };
      });
      try {
        const params = {
          ..._.pickBy(query || queryParams, (val: any) => !!val)
        };
        const res: any = await queryModelsList(params, {
          cancelToken: axiosToken.token
        });

        // if the current page is beyond total page, fetch again
        if (
          !res.items.length &&
          params.page > res.pagination.totalPage &&
          res.pagination.totalPage > 0
        ) {
          const newParams = {
            ...params,
            page: res.pagination.totalPage
          };
          const newRes: any = await queryModelsList(newParams, {
            cancelToken: axiosToken.token
          });
          setDataSource({
            dataList: newRes.items || [],
            loading: false,
            loadend: true,
            total: newRes.pagination.total,
            deletedIds: []
          });
          return;
        }

        setDataSource({
          dataList: res.items || [],
          loading: false,
          loadend: true,
          total: res.pagination.total,
          deletedIds: []
        });
      } catch (error) {
        if (!isPageHidden.current) {
          setDataSource({
            dataList: [],
            loading: false,
            loadend: true,
            total: dataSource.total,
            deletedIds: []
          });
        }
      }
    }
  );

  const handleQueryChange = (params: any) => {
    setQueryParams({
      ...queryParams,
      ...params
    });
    fetchData({ query: { ...queryParams, ...params } });
  };

  const handlePageChange = useMemoizedFn(
    (page: number, pageSize: number | undefined) => {
      handleQueryChange({
        page: page,
        perPage: pageSize || 10
      });
    }
  );

  const updateHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const updateInstanceHandler = (list: any) => {
    // filter the data
    _.each(list, (data: any) => {
      updateInstanceChunkedList(data);
    });
  };

  const createModelsChunkRequest = useMemoizedFn(
    async (params?: {
      search: string;
      categories: any[];
      cluster_id: number;
      state?: string;
    }) => {
      const search = params?.search || queryParams.search;
      const categories = params?.categories || queryParams.categories;
      chunkRequedtRef.current?.current?.cancel?.();
      try {
        const query = {
          search: search,
          categories: categories
        };
        chunkRequedtRef.current = setChunkRequest({
          url: `${MODELS_API}?${qs.stringify(_.pickBy(query, (val: any) => !!val))}`,
          handler: updateHandler
        });
      } catch (error) {
        // ignore
      }
    }
  );

  const createModelsInstanceChunkRequest = useMemoizedFn(async () => {
    chunkInstanceRequedtRef.current?.current?.cancel?.();
    cacheInsDataListRef.current = [];
    try {
      chunkInstanceRequedtRef.current = setModelInstanceChunkRequest({
        url: `${MODEL_INSTANCE_API}`,
        params: {},
        handler: updateInstanceHandler
      });
    } catch (error) {
      // ignore
    }
  });

  const handleOnViewLogs = useMemoizedFn(() => {
    isPageHidden.current = true;
    chunkRequedtRef.current?.current?.cancel?.();
    cacheDataListRef.current = [];
    cacheInsDataListRef.current = [];
    chunkInstanceRequedtRef.current?.current?.cancel?.();
    instancesToken.current?.cancel?.();
  });

  const handleOnCancelViewLogs = useMemoizedFn(async () => {
    isPageHidden.current = false;
    fetchData({
      loadingVal: false
    });
    await getAllModelInstances();
    await createModelsInstanceChunkRequest();
    await createModelsChunkRequest();
  });

  const handleSearchBySilent = useMemoizedFn(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    fetchData({
      loadingVal: false
    });
  });

  const handleSearch = useMemoizedFn(async (params?: any) => {
    await fetchData(params);
  });

  const debounceUpdateFilter = _.debounce((e: any) => {
    handleQueryChange({
      page: 1,
      search: e.target.value
    });
    createModelsChunkRequest({
      search: e.target.value,
      categories: queryParams.categories,
      cluster_id: queryParams.cluster_id || 0
    });
  }, 350);

  const handleNameChange = useMemoizedFn(debounceUpdateFilter);

  const handleCategoryChange = async (value: any) => {
    handleQueryChange({
      page: 1,
      categories: value
    });
    createModelsChunkRequest({
      search: queryParams.search,
      cluster_id: queryParams.cluster_id || 0,
      categories: value
    });
  };

  const handleOnStatusChange = async (value: string | undefined) => {
    handleQueryChange({
      page: 1,
      state: value
    });
    createModelsChunkRequest({
      search: queryParams.search,
      categories: queryParams.categories,
      cluster_id: queryParams.cluster_id || 0,
      state: value
    });
  };

  const handleClusterChange = async (value: number) => {
    handleQueryChange({
      page: 1,
      cluster_id: value
    });
    createModelsChunkRequest({
      search: queryParams.search,
      categories: queryParams.categories,
      cluster_id: value
    });
  };

  const handleOnSortChange = (order: TableOrder | Array<TableOrder>) => {
    let orderList = Array.isArray(order) ? order : [order];
    if (orderList[0].columnKey === 'replicas') {
      orderList.push({
        columnKey: 'ready_replicas',
        order: orderList[0].order
      });
    }
    const sortKeys = handleMultiSortChange(orderList);
    setQueryParams((pre: any) => {
      return {
        ...pre,
        page: 1,
        sort_by: sortKeys.join(',')
      };
    });
    fetchData({
      query: {
        ...queryParams,
        page: 1,
        sort_by: sortKeys.join(',')
      }
    });
  };

  const handleOnFilterChange = (filters: any) => {
    handleQueryChange({
      page: 1,
      ...filters
    });
    createModelsChunkRequest({
      search: queryParams.search,
      ...filters
    });
  };

  const handleDeleteInstanceFromCache = (id: number) => {
    cacheInsDataListRef.current = cacheInsDataListRef.current.filter(
      (item) => item.id !== id
    );
    setModelInstances(cacheInsDataListRef.current);
  };

  useEffect(() => {
    let timer: any = null;
    // fetch data first time
    const getTableData = async (loadingVal?: boolean) => {
      axiosToken?.cancel?.();
      axiosToken = createAxiosToken();
      setDataSource((pre) => {
        pre.loading = loadingVal ?? true;
        return { ...pre };
      });
      try {
        const params = {
          ..._.pickBy(queryParams, (val: any) => !!val)
        };
        const res: any = await queryModelsList(params, {
          cancelToken: axiosToken.token
        });
        return res;
      } catch (error) {
        return {};
      }
    };

    const init = async () => {
      const [modelRes] = await Promise.all([getTableData()]);

      setDataSource({
        dataList: modelRes.items || [],
        loading: false,
        loadend: true,
        total: modelRes.pagination?.total || 0,
        deletedIds: []
      });

      clearTimeout(timer);
      timer = setTimeout(() => {
        createModelsInstanceChunkRequest();
        createModelsChunkRequest();
      }, 1000);
    };
    init();
    return () => {
      clearTimeout(timer);
      axiosToken?.cancel?.();
      chunkRequedtRef.current?.current?.cancel?.();
      cacheDataListRef.current = [];
      cacheInsDataListRef.current = [];
      chunkInstanceRequedtRef.current?.current?.cancel?.();
      instancesToken.current?.cancel?.();
    };
  }, []);

  const setDisableExpand = useMemoizedFn((record: any) => {
    return !record?.replicas;
  });

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        isPageHidden.current = false;
        fetchData({
          loadingVal: false
        });
        await getAllModelInstances();
        await createModelsInstanceChunkRequest();
        await createModelsChunkRequest();
      } else {
        isPageHidden.current = true;
        chunkRequedtRef.current?.current?.cancel?.();
        cacheDataListRef.current = [];
        cacheInsDataListRef.current = [];
        chunkInstanceRequedtRef.current?.current?.cancel?.();
        instancesToken.current?.cancel?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, createModelsChunkRequest, createModelsInstanceChunkRequest]);

  return (
    <TableContext.Provider
      value={{
        allChildren: modelInstances,
        setDisableExpand: setDisableExpand
      }}
    >
      <TableList
        dataSource={dataSource.dataList}
        onStatusChange={handleOnStatusChange}
        handleNameChange={handleNameChange}
        handleCategoryChange={handleCategoryChange}
        handleClusterChange={handleClusterChange}
        handleSearch={handleSearch}
        handlePageChange={handlePageChange}
        handleDeleteSuccess={fetchData}
        handleOnToggleExpandAll={createModelsInstanceChunkRequest}
        onViewLogs={handleOnViewLogs}
        onCancelViewLogs={handleOnCancelViewLogs}
        onStop={handleSearchBySilent}
        onStart={handleSearchBySilent}
        onTableSort={handleOnSortChange}
        onFilterChange={handleOnFilterChange}
        onDeleteInstanceFromCache={handleDeleteInstanceFromCache}
        sortOrder={sortOrder}
        queryParams={queryParams}
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        total={dataSource.total}
        deleteIds={dataSource.deletedIds}
      ></TableList>
    </TableContext.Provider>
  );
};

export default Models;
