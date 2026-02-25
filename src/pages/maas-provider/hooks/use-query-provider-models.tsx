import { createAxiosToken } from '@/hooks/use-chunk-request';
import ErrorMessageContent from '@/pages/_components/error-message-content';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import {
  queryProviderModels,
  queryProviderModelsInEditing,
  testProviderModel,
  testProviderModelInEditing
} from '../apis';

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
      id: number;
      data: {
        api_token: string;
        config: { type: string; [key: string]: any };
        proxy_url: string;
      };
    }) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      if (params.id) {
        return await queryProviderModelsInEditing(params, {
          token: axiosTokenRef.current.token
        });
      }
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
      id: number;
      data: {
        api_token: string;
        config: { type: string; [key: string]: any };
        model_name: string;
        proxy_url: string;
      };
    }) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();

      // for edit page
      if (params.id) {
        return await testProviderModelInEditing(params, {
          token: axiosTokenRef.current.token
        });
      }
      // for create page
      return await testProviderModel(params, {
        token: axiosTokenRef.current.token
      });
    },
    {
      manual: true,
      onSuccess: (response) => {
        if (!response?.accessible) {
          message.error({
            content: (
              <ErrorMessageContent
                errMsg={response?.error_message || 'Test model failed'}
              ></ErrorMessageContent>
            )
          });
        }
      },
      onError: (error) => {
        message.error({
          content: (
            <ErrorMessageContent
              errMsg={error?.message || 'Test model failed'}
            ></ErrorMessageContent>
          )
        });
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
