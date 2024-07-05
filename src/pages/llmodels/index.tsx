import useSetChunkRequest, {
  createAxiosToken
} from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import _ from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { MODELS_API, queryModelsList } from './apis';
import TableList from './components/table-list';
import { ListItem } from './config/types';

const Models: React.FC = () => {
  // const { modal } = App.useApp();
  console.log('model list====1');

  const { setChunkRequest } = useSetChunkRequest();

  const [total, setTotal] = useState(100);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<ListItem[]>([]);
  const chunkRequedtRef = useRef<any>();
  let axiosToken = createAxiosToken();
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    query: ''
  });
  // request data

  const { updateChunkedList } = useUpdateChunkedList(dataSource, {
    setDataList: setDataSource
  });

  const fetchData = useCallback(async () => {
    axiosToken?.cancel?.();
    axiosToken = createAxiosToken();
    setLoading(true);
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryModelsList(params, {
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
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
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

  const handleSearch = useCallback((e: any) => {
    fetchData();
  }, []);

  const handleNameChange = useCallback(
    (e: any) => {
      setQueryParams({
        ...queryParams,
        query: e.target.value
      });
    },
    [queryParams]
  );

  useEffect(() => {
    fetchData();
    return () => {
      chunkRequedtRef.current?.current?.cancel?.();
      axiosToken?.cancel?.();
    };
  }, [queryParams]);

  return (
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
  );
};

export default memo(Models);
