import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';

/**

 *  generic hook to query data list
 * @template ListItem
 * @param Params - query params type, e.g. { page: number; perPage: number }
 * @param option.fetchList: (params, extra) => Promise<{ items: ListItem[] }>
 * @returns loading, dataList, fetchData, cancelRequest
 */
export function useQueryDataList<ListItem, Params = any>(option: {
  key: string;
  fetchList: (
    params: Params,
    options?: any
  ) => Promise<Global.PageResponse<ListItem>>;
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
  errorMsg?: string;
}): {
  loading: boolean;
  dataList: Array<ListItem & { label: string; value: any }>;
  cancelRequest: () => void;
  fetchData: (params: Params, extra?: any) => Promise<ListItem[]>;
} {
  const { key, fetchList, getLabel, getValue, errorMsg } = option;
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [dataList, setDataList] = useState<
    Array<ListItem & { label: string; value: any }>
  >([]);

  const {
    runAsync: fetchData,
    loading,
    cancel
  } = useRequest(
    async (params: Params, extra?: any) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      const res = await fetchList(params, {
        token: axiosTokenRef.current?.token,
        ...(extra || {})
      });

      setDataList(
        res.items?.map((item: ListItem) => ({
          ...item,
          label: getLabel ? getLabel(item) : (item as any).name,
          value: getValue ? getValue(item) : (item as any).id
        })) || []
      );

      return res.items || [];
    },
    {
      manual: true,
      onSuccess: () => {},
      onError: (error) => {
        message.error(
          error?.message || errorMsg || `Failed to fetch ${key} list`
        );
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
    dataList,
    cancelRequest,
    fetchData
  };
}

export function useQueryData<Detail, Params = any>(option: {
  key: string;
  delay?: number;
  fetchDetail: (params: Params, options?: any) => Promise<Detail>;
  getData?: (response: Detail, params?: any) => any;
  errorMsg?: string;
}): {
  loading: boolean;
  detailData: Detail;
  cancelRequest: () => void;
  fetchData: (params: Params, extra?: any) => Promise<Detail>;
} {
  const { key, fetchDetail, getData, errorMsg, delay } = option;
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [detailData, setDetailData] = useState<Detail>({} as Detail);

  const {
    runAsync: fetchData,
    loading,
    cancel
  } = useRequest(
    async (params: Params, extra?: any) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      const res = await fetchDetail(params, {
        token: axiosTokenRef.current?.token,
        ...(extra || {})
      });

      if (delay) {
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }

      setDetailData(getData ? getData(res, params) : res);

      return res;
    },
    {
      manual: true,
      onSuccess: () => {},
      onError: (error) => {
        message.error(
          error?.message || errorMsg || `Failed to fetch ${key} data`
        );
        setDetailData({} as Detail);
      }
    }
  );

  const cancelRequest = () => {
    cancel();
    axiosTokenRef.current?.cancel();
  };

  useEffect(() => {
    return () => {
      cancelRequest();
    };
  }, []);

  return {
    loading,
    detailData,
    cancelRequest,
    fetchData
  };
}
