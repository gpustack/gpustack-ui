import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { request } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';

export default function useWatchList<T = Record<string, any>>(API: string) {
  const watchAPI = API;
  const [watchDataList, setWatchDataList] = useState<T[]>([]);
  const chunkRequestRef = useRef<any>(null);
  const listRequestTokenRef = useRef<any>(null);

  const { setChunkRequest, createAxiosToken } = useSetChunkRequest();

  const { updateChunkedList, cacheDataListRef: cacheWatchDataListRef } =
    useUpdateChunkedList({
      dataList: watchDataList,
      limit: 100,
      setDataList: setWatchDataList
    });

  const updateWatchDataListHandler = (list: any) => {
    // filter the data
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const createWatchChunkRequest = useMemoizedFn(async () => {
    chunkRequestRef.current?.current?.cancel?.();
    try {
      chunkRequestRef.current = setChunkRequest({
        url: `${watchAPI}`,
        params: {},
        handler: updateWatchDataListHandler
      });
    } catch (error) {
      // ignore
    }
  });

  const queryAllDataList = async (
    params: Global.SearchParams,
    options?: any
  ) => {
    return request<Global.PageResponse<T>>(watchAPI, {
      params,
      method: 'GET',
      cancelToken: options?.token
    });
  };

  const handleDeleteItemFromCache = (id: number) => {
    cacheWatchDataListRef.current = cacheWatchDataListRef.current.filter(
      (item) => item.id !== id
    );
    setWatchDataList(cacheWatchDataListRef.current);
  };

  const getAllDataList = useMemoizedFn(async () => {
    try {
      listRequestTokenRef.current?.cancel?.();
      listRequestTokenRef.current = createAxiosToken();
      const params = {
        page: 1,
        perPage: 100
      };
      const res: any = await queryAllDataList(params, {
        token: listRequestTokenRef.current.token
      });
      cacheWatchDataListRef.current = res.items || [];
      setWatchDataList(res.items || []);
    } catch (error) {
      // ignore
    }
  });

  useEffect(() => {
    createWatchChunkRequest();
    return () => {
      chunkRequestRef.current?.cancel?.();
      listRequestTokenRef.current?.cancel?.();
    };
  }, []);

  return {
    watchDataList,
    deleteItemFromCache: handleDeleteItemFromCache
  };
}
