import TableContext from '@/components/seal-table/table-context';
import useSetChunkRequest, {
  createAxiosToken
} from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import _ from 'lodash';
import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { MODELS_API, MODEL_INSTANCE_API, queryModelsList } from './apis';
import TableList from './components/table-list';
import { ListItem } from './config/types';

const Models: React.FC = () => {
  // const { modal } = App.useApp();
  console.log('model list====1');

  const { setChunkRequest } = useSetChunkRequest();
  const { setChunkRequest: setModelInstanceChunkRequest } =
    useSetChunkRequest();
  const [total, setTotal] = useState(100);
  const [modelInstances, setModelInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<ListItem[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const chunkRequedtRef = useRef<any>();
  const chunkInstanceRequedtRef = useRef<any>();
  const dataSourceRef = useRef<any>();
  let axiosToken = createAxiosToken();
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    search: ''
  });
  // request data

  dataSourceRef.current = dataSource;

  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    dataList: dataSource,
    setDataList: setDataSource
  });
  const {
    updateChunkedList: updateInstanceChunkList,
    cacheDataListRef: cacheInstanceDataListRef
  } = useUpdateChunkedList({
    dataList: modelInstances,
    setDataList: setModelInstances
  });

  const fetchData = useCallback(async () => {
    axiosToken?.cancel?.();
    axiosToken = createAxiosToken();
    setLoading(true);
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res: any = await queryModelsList(params, {
        cancelToken: axiosToken.token
      });
      console.log('res=======', res);
      setDataSource(res.items);
      setTotal(res.pagination.total);
    } catch (error) {
      setDataSource([]);
      console.log('error', error);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [queryParams]);

  const handleShowSizeChange = useCallback(
    (page: number, size: number) => {
      console.log(page, size);
      setQueryParams({
        ...queryParams,
        perPage: size
      });
    },
    [queryParams]
  );

  const handlePageChange = useCallback(
    (page: number, pageSize: number | undefined) => {
      console.log(page, pageSize);
      setQueryParams({
        ...queryParams,
        page: page
      });
    },
    [queryParams]
  );

  const updateHandler = (list: any) => {
    console.log('updateHandler=====', list);
    _.each(list, (data: any) => {
      updateChunkedList(data, dataSourceRef.current);
    });
  };

  const updateInstanceHandler = (list: any) => {
    console.log('updateInstanceHandler=====', list);
    setModelInstances(list);
    // _.each(list, (data: any) => {
    //   updateInstanceChunkList(data);
    // });
  };

  const createModelsChunkRequest = () => {
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
  };
  const createModelsInstanceChunkRequest = () => {
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
  };

  const handleSearch = useCallback((e: any) => {
    fetchData();
  }, []);

  const handleNameChange = useCallback(
    (e: any) => {
      setQueryParams({
        ...queryParams,
        search: e.target.value
      });
    },
    [queryParams]
  );

  useEffect(() => {
    if (!firstLoad) {
      createModelsChunkRequest();
      createModelsInstanceChunkRequest();
    }
    return () => {
      chunkRequedtRef.current?.current?.cancel?.();
      cacheDataListRef.current = [];
      chunkInstanceRequedtRef.current?.current?.cancel?.();
      cacheInstanceDataListRef.current = [];
    };
  }, [firstLoad]);

  useEffect(() => {
    fetchData();
    return () => {
      axiosToken?.cancel?.();
    };
  }, [queryParams]);

  return (
    <StrictMode>
      <TableContext.Provider
        value={{
          allChildren: modelInstances
        }}
      >
        <TableList
          dataSource={dataSource}
          handleNameChange={handleNameChange}
          handleSearch={handleSearch}
          handleShowSizeChange={handleShowSizeChange}
          handlePageChange={handlePageChange}
          createModelsChunkRequest={createModelsChunkRequest}
          queryParams={queryParams}
          loading={loading}
          total={total}
          fetchData={fetchData}
        ></TableList>
      </TableContext.Provider>
    </StrictMode>
  );
};

export default Models;
