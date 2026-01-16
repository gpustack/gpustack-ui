import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { WORKERS_API } from '../../resources/apis';

export default function useAddWorkerMessage() {
  const chunkRequestRef = useRef<any>(null);
  const newItemsRef = useRef<any[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const timerRef = useRef<any>(null);

  const showAddWorkerMessage = () => {
    if (newItemsRef.current.length > 0) {
      const count = newItemsRef.current.length;
      setAddedCount(count);
    }
  };

  const { setChunkRequest, startLoadingRef } = useSetChunkRequest();
  const { updateChunkedList } = useUpdateChunkedList({
    events: ['CREATE', 'INSERT'],
    dataList: [],
    onCreate: (newItems: any) => {
      if (startLoadingRef.current) {
        newItemsRef.current = newItemsRef.current.concat(newItems);
        showAddWorkerMessage();
      }
    }
  });

  const updateHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const resetAddedCount = () => {
    setAddedCount(0);
    newItemsRef.current = [];
    clearTimeout(timerRef.current);
  };

  const createModelsChunkRequest = async () => {
    chunkRequestRef.current?.current?.cancel?.();
    resetAddedCount();
    try {
      chunkRequestRef.current = setChunkRequest({
        url: WORKERS_API,
        handler: updateHandler
      });
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      chunkRequestRef.current?.current?.cancel?.();
      newItemsRef.current = [];
      clearTimeout(timerRef.current);
    };
  }, []);

  return {
    addedCount,
    chunkRequestRef,
    createModelsChunkRequest
  };
}
