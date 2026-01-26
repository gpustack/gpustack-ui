import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { queryModelsList } from '../apis';
import { ListItem } from '../config/types';

/**
 *
 * @returns loading, fetch, dataList
 */
export const useQueryModelList = () => {
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [dataList, setDataList] = useState<
    Array<Partial<ListItem> & { label: string; value: number }>
  >([]);

  const {
    runAsync: fetchData,
    loading,
    cancel
  } = useRequest(
    async (params: { page: number; perPage?: number; cluster_id?: number }) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      const res = await queryModelsList(params, {
        token: axiosTokenRef.current.token
      });
      setDataList(
        res.items?.map((item: ListItem) => ({
          ...item,
          label: item.name,
          value: item.id
        })) || []
      );
      return res.items || [];
    },
    {
      manual: true,
      onSuccess: (response) => {},
      onError: (error) => {
        message.error(error?.message || 'Failed to fetch model list');
        setDataList([]);
      }
    }
  );

  const cancelRequest = () => {
    cancel();
    axiosTokenRef.current?.cancel();
  };

  useEffect(() => {
    return () => {
      cancel();
      axiosTokenRef.current?.cancel();
    };
  }, []);

  return {
    loading,
    modelList: dataList,
    cancelRequest,
    fetchModelList: fetchData
  };
};
