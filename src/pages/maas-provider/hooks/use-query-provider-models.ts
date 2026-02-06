import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { queryProviderModels, testProviderModel } from '../apis';

/**
 *
 * @returns loading, fetch, dataList
 */
export const useQueryProviderModels = () => {
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [providerModelList, setProviderModelList] = useState<any[]>([]);

  const {
    run: fetchProviderModels,
    loading,
    cancel
  } = useRequest(
    async (params: {
      data: { api_token: string; config: { type: string } };
    }) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      return await queryProviderModels(params, {
        token: axiosTokenRef.current.token
      });
    },
    {
      manual: true,
      onSuccess: (response) => {
        setProviderModelList(
          response.data?.map((item: any) => ({
            label: item.id,
            value: item.id,
            accessible: item.accessible,
            category: item.categories?.[0] || ''
          })) || []
        );
      },
      onError: () => {
        setProviderModelList([]);
      }
    }
  );

  useEffect(() => {
    return () => {
      cancel();
      axiosTokenRef.current?.cancel();
    };
  }, []);

  return {
    loading,
    providerModelList,
    fetchProviderModels
  };
};

export const useTestProviderModel = () => {
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);

  const {
    runAsync: runTestModel,
    loading,
    cancel
  } = useRequest(
    async (params: {
      data: { api_token: string; config: { type: string }; model_name: string };
    }) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      const response = await testProviderModel(params, {
        token: axiosTokenRef.current.token
      });
      return response;
    },
    {
      manual: true,
      onSuccess: (response) => {
        if (!response?.accessible) {
          message.error(response?.error_message || 'Test model failed');
        }
      },
      onError: (error) => {
        message.error(error?.message || 'Test model failed');
      }
    }
  );

  useEffect(() => {
    return () => {
      cancel();
      axiosTokenRef.current?.cancel();
    };
  }, []);

  return {
    loading,
    runTestModel
  };
};
