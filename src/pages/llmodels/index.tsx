import TableContext from '@/components/seal-table/table-context';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { queryWorkersList } from '@/pages/resources/apis';
import { ListItem as WokerListItem } from '@/pages/resources/config/types';
import { IS_FIRST_LOGIN, readState } from '@/utils/localstore';
import _ from 'lodash';
import qs from 'query-string';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MODELS_API,
  MODEL_INSTANCE_API,
  queryCatalogItemSpec,
  queryCatalogList,
  queryModelsInstances,
  queryModelsList
} from './apis';
import TableList from './components/table-list';
import { backendOptionsMap } from './config';
import { ListItem } from './config/types';
import { useGenerateModelFileOptions } from './hooks';

const Models: React.FC = () => {
  const { getModelFileList, generateModelFileOptions } =
    useGenerateModelFileOptions();
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

  const [catalogList, setCatalogList] = useState<any[]>([]);
  const [workerList, setWorkerList] = useState<WokerListItem[]>([]);
  const [modelFileOptions, setModelFileOptions] = useState<any[]>([]);
  const chunkRequedtRef = useRef<any>();
  const chunkInstanceRequedtRef = useRef<any>();
  const isPageHidden = useRef(false);
  const instancesToken = useRef<any>();
  let axiosToken = createAxiosToken();
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    search: '',
    categories: []
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

  const getAllModelInstances = useCallback(async () => {
    try {
      instancesToken.current?.cancel?.();
      instancesToken.current = createAxiosToken();
      const params = {
        page: 1,
        perPage: 100
      };
      const res: any = await queryModelsInstances(params, {
        token: instancesToken.current.token
      });
      cacheInsDataListRef.current = res.items || [];
      setModelInstances(res.items || []);
    } catch (error) {
      // ignore
    }
  }, []);

  const fetchData = useCallback(
    async (params?: {
      loadingVal?: boolean;
      query?: {
        page: number;
        perPage: number;
        search: string;
        categories: any[];
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
    },
    [queryParams]
  );

  const handlePageChange = useCallback(
    (page: number, pageSize: number | undefined) => {
      setQueryParams({
        ...queryParams,
        page: page,
        perPage: pageSize || 10
      });
      fetchData({
        query: {
          ...queryParams,
          page: page,
          perPage: pageSize || 10
        }
      });
    },
    [queryParams]
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

  const createModelsChunkRequest = useCallback(
    async (params?: { search: string; categories: any[] }) => {
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
    },
    [queryParams.categories, queryParams.search]
  );

  const createModelsInstanceChunkRequest = useCallback(async () => {
    chunkInstanceRequedtRef.current?.current?.cancel?.();
    try {
      chunkInstanceRequedtRef.current = setModelInstanceChunkRequest({
        url: `${MODEL_INSTANCE_API}`,
        params: {},
        handler: updateInstanceHandler
      });
    } catch (error) {
      // ignore
    }
  }, [updateInstanceHandler]);

  const handleOnViewLogs = useCallback(() => {
    isPageHidden.current = true;
    chunkRequedtRef.current?.current?.cancel?.();
    cacheDataListRef.current = [];
    cacheInsDataListRef.current = [];
    chunkInstanceRequedtRef.current?.current?.cancel?.();
    instancesToken.current?.cancel?.();
  }, []);

  const handleOnCancelViewLogs = useCallback(async () => {
    isPageHidden.current = false;
    await getAllModelInstances();
    await createModelsInstanceChunkRequest();
    await createModelsChunkRequest();
    fetchData({
      loadingVal: false
    });
  }, [fetchData, createModelsChunkRequest, createModelsInstanceChunkRequest]);

  const handleSearchBySilent = useCallback(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    fetchData({
      loadingVal: false
    });
  }, [fetchData]);

  const handleSearch = useCallback(
    async (params?: any) => {
      await fetchData(params);
    },
    [fetchData]
  );

  const debounceUpdateFilter = _.debounce((e: any) => {
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
    createModelsChunkRequest({
      search: e.target.value,
      categories: queryParams.categories
    });
  }, 350);

  const handleNameChange = useCallback(debounceUpdateFilter, [queryParams]);

  const handleCategoryChange = useCallback(
    async (value: any) => {
      setQueryParams({
        ...queryParams,
        page: 1,
        categories: value
      });
      fetchData({
        query: {
          ...queryParams,
          page: 1,
          categories: value
        }
      });
      createModelsChunkRequest({
        search: queryParams.search,
        categories: value
      });
    },
    [queryParams]
  );

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

    // get worker list
    const getWorkerList = async (): Promise<any> => {
      try {
        const data = await queryWorkersList({ page: 1, perPage: 100 });
        return data;
      } catch (error) {
        // ingore
        return {};
      }
    };

    // get catalog list
    const getCataLogList = async () => {
      const isFirstLogin = readState(IS_FIRST_LOGIN);
      if (!isFirstLogin) {
        return;
      }
      try {
        const res: any = await queryCatalogList({
          search: 'DeepSeek R1',
          page: 1
        });
        if (!res?.items?.length) {
          return [];
        }
        const name = _.toLower(res?.items[0]?.name).replace(/\s/g, '-') || '';
        const catalogSpecs: any = await queryCatalogItemSpec({
          id: res?.items[0]?.id
        });
        const list = catalogSpecs?.items?.map((item: any) => {
          item.name = name;
          return item;
        });
        const deepseekr1dstill = _.toLower('DeepSeek-R1-Distill-Qwen-1.5B');
        const resultList = list?.filter((item: any) => {
          return (
            item.backend === backendOptionsMap.llamaBox &&
            (_.toLower(item?.huggingface_repo_id)?.indexOf(deepseekr1dstill) >
              -1 ||
              _.toLower(item?.model_scope_model_id)?.indexOf(deepseekr1dstill) >
                -1)
          );
        });
        return resultList || [];
      } catch (error) {
        // ignore
        return [];
      }
    };

    const init = async () => {
      const [modelRes, workerRes, modelFileList] = await Promise.all([
        getTableData(),
        getWorkerList(),
        getModelFileList()
      ]);
      const dataList = generateModelFileOptions(
        modelFileList,
        workerRes.items || []
      );
      setDataSource({
        dataList: modelRes.items || [],
        loading: false,
        loadend: true,
        total: modelRes.pagination?.total || 0,
        deletedIds: []
      });
      setWorkerList(workerRes.items || []);
      setModelFileOptions(dataList);

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

  const setDisableExpand = useCallback((record: any) => {
    return !record?.replicas;
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        isPageHidden.current = false;
        await getAllModelInstances();
        await createModelsInstanceChunkRequest();
        await createModelsChunkRequest();
        fetchData({
          loadingVal: false
        });
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
        handleNameChange={handleNameChange}
        handleCategoryChange={handleCategoryChange}
        handleSearch={handleSearch}
        handlePageChange={handlePageChange}
        handleDeleteSuccess={fetchData}
        handleOnToggleExpandAll={createModelsInstanceChunkRequest}
        onViewLogs={handleOnViewLogs}
        onCancelViewLogs={handleOnCancelViewLogs}
        onStop={handleSearchBySilent}
        onStart={handleSearchBySilent}
        queryParams={queryParams}
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        total={dataSource.total}
        deleteIds={dataSource.deletedIds}
        workerList={workerList}
        modelFileOptions={modelFileOptions}
        catalogList={catalogList}
      ></TableList>
    </TableContext.Provider>
  );
};

export default Models;
