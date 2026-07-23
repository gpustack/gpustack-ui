import { WatchEventType } from '@/config';
import useSetChunkRequest, {
  createAxiosToken
} from '@/hooks/use-chunk-request';
import { useRequest } from 'ahooks';
import { CancelTokenSource } from 'axios';
import qs from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { GPU_INSTANCE_TYPES_API, queryGPUInstanceTypes } from '../apis';
import { ListItem } from '../config/types';

// Merge a batch of watch events into the current name-keyed list. Instance
// types have no numeric id, so we upsert / remove by `name` rather than reuse
// the shared id-based chunked-list helper.
const mergeWatchEvents = (current: ListItem[], events: any[]) => {
  let list = [...current];
  events.forEach((event: any) => {
    const collection: ListItem[] = event?.collection || [];
    if (event?.type === WatchEventType.DELETE) {
      const names = collection.map((item) => item.name);
      list = list.filter((item) => !names.includes(item.name));
    } else if (
      event?.type === WatchEventType.CREATE ||
      event?.type === WatchEventType.UPDATE
    ) {
      collection.forEach((item) => {
        const index = list.findIndex((it) => it.name === item.name);
        if (index > -1) {
          list[index] = item;
        } else {
          list = [item, ...list];
        }
      });
    }
  });
  return list;
};

// Cluster-scoped instance types for the management list. Action-driven:
// call fetchInstanceTypes(clusterId) from the cluster picker / refresh, not
// via an effect dependency. startWatch(clusterId) opens a chunked watch that
// keeps the list in sync with live create/update/delete events.
export default function useQueryInstanceTypes() {
  const tokenRef = useRef<CancelTokenSource | null>(null);
  const chunkRequestRef = useRef<any>(null);
  const { setChunkRequest } = useSetChunkRequest();
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

  const stopWatch = () => {
    chunkRequestRef.current?.current?.cancel?.();
  };

  const startWatch = (clusterId: number) => {
    stopWatch();
    chunkRequestRef.current = setChunkRequest({
      url: `${GPU_INSTANCE_TYPES_API}?${qs.stringify({
        cluster_id: clusterId
      })}`,
      handler: (events: any[]) => {
        setDataList((pre) => mergeWatchEvents(pre, events));
      }
    });
  };

  useEffect(() => {
    return () => {
      cancel();
      tokenRef.current?.cancel();
      stopWatch();
    };
  }, []);

  return {
    dataList,
    loading,
    fetchInstanceTypes,
    cancelRequest,
    startWatch,
    stopWatch,
    setDataList
  };
}
