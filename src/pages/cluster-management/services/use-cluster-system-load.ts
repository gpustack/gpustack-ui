import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { queryClusterDetail } from '../apis';

export const useClusterSystemLoad = () => {
  const [systemLoad, setSystemLoad] = useState<{
    current: {
      cpu: number;
      ram: number;
      gpu: number;
      vram: number;
    };
    history: Record<string, { timestamp: number; value: number }[]>;
  }>({
    current: {
      cpu: 0,
      ram: 0,
      gpu: 0,
      vram: 0
    },
    history: {}
  });
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);

  const {
    run: fetchClusterSystemLoad,
    loading,
    cancel
  } = useRequest(
    async (params) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      return await queryClusterDetail(params, {
        token: axiosTokenRef.current.token
      });
    },
    {
      manual: true,
      onSuccess: (response) => {
        setSystemLoad({
          current: response.system_load?.current,
          history: response.system_load?.history
        });
      },
      onError: () => {
        setSystemLoad({
          current: {
            cpu: 0,
            ram: 0,
            gpu: 0,
            vram: 0
          },
          history: {}
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
    systemLoad,
    loading,
    fetchClusterSystemLoad
  };
};
