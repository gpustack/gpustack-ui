import { clusterDetailAtom } from '@/atoms/clusters';
import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { CancelTokenSource } from 'axios';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { queryClusterDetail, queryClusterItem } from '../apis';
import { ClusterListItem } from '../config/types';

export const useClusterSystemLoad = () => {
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
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
      cacheKey: 'cluster-system-load',
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

export const useClusterDetail = () => {
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [clusterDetail, setClusterDetail] = useState<ClusterListItem>(
    {} as ClusterListItem
  );
  const [, setClusterDetailAtom] = useAtom(clusterDetailAtom);

  const {
    run: fetchClusterDetail,
    loading,
    cancel
  } = useRequest(
    async (params) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      return await queryClusterItem(params, {
        token: axiosTokenRef.current.token
      });
    },
    {
      manual: true,
      onSuccess: (response) => {
        setClusterDetail(response);
        setClusterDetailAtom(response);
      },
      onError: () => {
        setClusterDetail({} as ClusterListItem);
        setClusterDetailAtom(null);
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
    clusterDetail,
    loading,
    fetchClusterDetail
  };
};
