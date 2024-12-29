import TableContext from '@/components/seal-table/table-context';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { queryWorkersList } from '@/pages/resources/apis';
import {
  GPUDeviceItem,
  ListItem as WokerListItem
} from '@/pages/resources/config/types';
import _ from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { MODELS_API, MODEL_INSTANCE_API, queryModelsList } from './apis';
import TableList from './components/table-list';
import { ListItem } from './config/types';

const Models: React.FC = () => {
  const { setChunkRequest, createAxiosToken } = useSetChunkRequest();
  const { setChunkRequest: setModelInstanceChunkRequest } =
    useSetChunkRequest();
  const [modelInstances, setModelInstances] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<{
    dataList: ListItem[];
    loading: boolean;
    total: number;
  }>({
    dataList: [],
    loading: false,
    total: 0
  });
  const [gpuDeviceList, setGpuDeviceList] = useState<GPUDeviceItem[]>([]);
  const [workerList, setWorkerList] = useState<WokerListItem[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const chunkRequedtRef = useRef<any>();
  const chunkInstanceRequedtRef = useRef<any>();
  const isPageHidden = useRef(false);
  let axiosToken = createAxiosToken();
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    search: ''
  });

  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    dataList: dataSource.dataList,
    setDataList(list) {
      setDataSource((pre) => {
        return {
          total: pre.total,
          loading: false,
          dataList: list
        };
      });
    }
  });

  const getWorkerList = async () => {
    try {
      const data = await queryWorkersList({ page: 1, perPage: 100 });
      setWorkerList(data.items || []);
    } catch (error) {
      // ingore
      setWorkerList([]);
    }
  };

  const fetchData = useCallback(async () => {
    axiosToken?.cancel?.();
    axiosToken = createAxiosToken();
    setDataSource((pre) => {
      pre.loading = true;
      return { ...pre };
    });
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res: any = await queryModelsList(params, {
        cancelToken: axiosToken.token
      });
      setDataSource({
        dataList: res.items || [],
        loading: false,
        total: res.pagination.total
      });
    } catch (error) {
      if (!isPageHidden.current) {
        setDataSource({
          dataList: [],
          loading: false,
          total: dataSource.total
        });
      }
      console.log('error+++', error);
    } finally {
      setFirstLoad(false);
    }
  }, [queryParams, firstLoad]);

  const handlePageChange = useCallback(
    (page: number, pageSize: number | undefined) => {
      setQueryParams({
        ...queryParams,
        page: page,
        perPage: pageSize || 10
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
    setModelInstances(list);
  };

  const createModelsChunkRequest = useCallback(async () => {
    chunkRequedtRef.current?.current?.cancel?.();
    try {
      chunkRequedtRef.current = setChunkRequest({
        url: `${MODELS_API}`,
        params: {
          ..._.pickBy(queryParams, (val: any) => !!val)
        },
        handler: updateHandler
      });
    } catch (error) {
      // ignore
    }
  }, [queryParams]);
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
  }, []);

  const handleSearch = useCallback(
    (e: any) => {
      fetchData();
    },
    [fetchData]
  );

  const handleNameChange = useCallback(
    (e: any) => {
      setQueryParams({
        ...queryParams,
        search: e.target.value
      });
    },
    [queryParams]
  );

  const handleOnViewLogs = useCallback(() => {
    isPageHidden.current = true;
    chunkRequedtRef.current?.current?.cancel?.();
    cacheDataListRef.current = [];
    chunkInstanceRequedtRef.current?.current?.cancel?.();
  }, []);

  const handleOnCancelViewLogs = useCallback(async () => {
    isPageHidden.current = false;
    await Promise.all([
      createModelsChunkRequest(),
      createModelsInstanceChunkRequest()
    ]);
    setTimeout(() => {
      fetchData();
    }, 100);
  }, [fetchData, createModelsChunkRequest, createModelsInstanceChunkRequest]);

  useEffect(() => {
    fetchData();
    return () => {
      axiosToken?.cancel?.();
    };
  }, [queryParams]);

  useEffect(() => {
    getWorkerList();

    return () => {
      chunkRequedtRef.current?.current?.cancel?.();
      cacheDataListRef.current = [];
      chunkInstanceRequedtRef.current?.current?.cancel?.();
    };
  }, []);

  useEffect(() => {
    if (!firstLoad) {
      setTimeout(() => {
        createModelsChunkRequest();
        createModelsInstanceChunkRequest();
      }, 100);
    }
  }, [firstLoad]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        isPageHidden.current = false;
        await Promise.all([
          createModelsChunkRequest(),
          createModelsInstanceChunkRequest()
        ]);
        fetchData();
      } else {
        isPageHidden.current = true;
        chunkRequedtRef.current?.current?.cancel?.();
        cacheDataListRef.current = [];
        chunkInstanceRequedtRef.current?.current?.cancel?.();
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
        allChildren: modelInstances
      }}
    >
      <TableList
        dataSource={dataSource.dataList}
        handleNameChange={handleNameChange}
        handleSearch={handleSearch}
        handlePageChange={handlePageChange}
        handleDeleteSuccess={fetchData}
        onViewLogs={handleOnViewLogs}
        onCancelViewLogs={handleOnCancelViewLogs}
        queryParams={queryParams}
        loading={dataSource.loading}
        total={dataSource.total}
        gpuDeviceList={gpuDeviceList}
        workerList={workerList}
      ></TableList>
    </TableContext.Provider>
  );
};

export default memo(Models);
