import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { queryModelInstancesList } from '../apis';
import { ModelInstanceListItem } from '../config/types';

/**
 *
 * @returns loading, fetch, dataList
 */
export const useQueryModelInstancesList = () => {
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [dataList, setDataList] = useState<
    Array<Partial<ModelInstanceListItem> & { label: string; value: string }>
  >([]);

  const {
    runAsync: fetchData,
    loading,
    cancel
  } = useRequest(
    async (params: { id: number }) => {
      const query = {
        page: -1,
        id: params.id
      };
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      const res = await queryModelInstancesList(query, {
        token: axiosTokenRef.current.token
      });
      setDataList(
        res.items?.map((item: ModelInstanceListItem) => ({
          ...item,
          label: item.name,
          value: item.name
        })) || []
      );
      return res.items || [];
    },
    {
      manual: true,
      onSuccess: (response) => {},
      onError: (error) => {
        message.error(error?.message || 'Failed to fetch model instances list');
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
    instanceList: dataList,
    cancelRequest,
    fetchInstanceList: fetchData
  };
};
