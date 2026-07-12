import { createAxiosToken } from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { queryGPUInstanceTypes } from '../apis';
import { ListItem } from '../config/types';

// Cluster-scoped instance types for the management list. Action-driven:
// call fetchInstanceTypes(clusterId) from the cluster picker / refresh, not
// via an effect dependency.
export default function useQueryInstanceTypes() {
  const tokenRef = useRef<CancelTokenSource | null>(null);
  const [dataList, setDataList] = useState<ListItem[]>([]);

  const {
    runAsync: fetchInstanceTypes,
    loading,
    cancel
  } = useRequest(
    async (clusterId: number) => {
      tokenRef.current?.cancel();
      tokenRef.current = createAxiosToken();
      const res = await queryGPUInstanceTypes(
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
        // Ignore the synthetic cancel error from switching clusters quickly.
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
    fetchInstanceTypes,
    cancelRequest,
    setDataList
  };
}
