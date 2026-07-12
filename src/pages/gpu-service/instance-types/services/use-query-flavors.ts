import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { queryGPUInstanceTypeFlavors } from '../apis';
import { FlavorItem } from '../config/types';

// Cluster-scoped flavors for the create drawer's first column. Fetched when
// the drawer opens (and on cluster change), never via an effect dependency.
export default function useQueryFlavors() {
  const tokenRef = useRef<CancelTokenSource | null>(null);
  const [dataList, setDataList] = useState<FlavorItem[]>([]);

  const {
    runAsync: fetchFlavors,
    loading,
    cancel
  } = useRequest(
    async (clusterId: number) => {
      tokenRef.current?.cancel();
      tokenRef.current = createAxiosToken();
      const res = await queryGPUInstanceTypeFlavors(
        { cluster_id: clusterId },
        { token: tokenRef.current.token }
      );
      const list = res?.items || [];
      setDataList(list);
      return list;
    },
    {
      manual: true,
      onError: (error: any) => {
        if (error?.message === 'CANCEL_PREVIOUS_REQUEST') return;
        setDataList([]);
      }
    }
  );

  const cancelRequest = () => {
    cancel();
    tokenRef.current?.cancel('CANCEL_PREVIOUS_REQUEST');
  };

  useEffect(() => {
    return () => {
      cancel();
      tokenRef.current?.cancel();
    };
  }, []);

  return {
    dataList,
    loading,
    fetchFlavors,
    cancelRequest,
    setDataList
  };
}
