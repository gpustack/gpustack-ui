import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { queryClusterList } from '../apis';
import { ClusterListItem } from '../config/types';

/**
 *
 * @returns loading, fetch, dataList
 */
export const useQueryClusterList = (options?: { useStateData?: boolean }) => {
  const { useStateData = true } = options || {};
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [dataList, setDataList] = useState<
    Array<Partial<ClusterListItem> & { label: string; value: number }>
  >([]);

  const {
    runAsync: fetchData,
    loading,
    cancel
  } = useRequest(
    async (params: { page: number; perPage?: number }) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      const res = await queryClusterList(params, {
        token: axiosTokenRef.current.token
      });
      if (useStateData) {
        setDataList(
          res.items?.map((item: ClusterListItem) => ({
            ...item,
            label: item.name,
            value: item.id
          })) || []
        );
      }
      return res.items || [];
    },
    {
      manual: true,
      onSuccess: (response) => {},
      onError: (error) => {
        message.error(error?.message || 'Failed to fetch cluster list');
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
    clusterList: dataList,
    cancelRequest,
    fetchClusterList: fetchData
  };
};
