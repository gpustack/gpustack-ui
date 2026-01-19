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
  const triggerAtRef = useRef<number>(0);

  const showAddWorkerMessage = () => {
    if (newItemsRef.current.length > 0) {
      const count = newItemsRef.current.length;
      setAddedCount(count);
    }
  };

  const { setChunkRequest } = useSetChunkRequest();
  const { updateChunkedList } = useUpdateChunkedList({
    events: ['CREATE', 'INSERT'],
    dataList: [],
    triggerAt: triggerAtRef,
    onCreate: (newItems: any) => {
      if (triggerAtRef.current) {
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
    chunkRequestRef.current?.current?.cancel?.();
    newItemsRef.current = [];
    triggerAtRef.current = 0;
    clearTimeout(timerRef.current);
  };

  const createModelsChunkRequest = async () => {
    resetAddedCount();
    try {
      chunkRequestRef.current = setChunkRequest({
        url: WORKERS_API,
        handler: updateHandler
      });
      triggerAtRef.current = Date.now();
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      resetAddedCount();
    };
  }, []);

  return {
    addedCount,
    chunkRequestRef,
    reset: resetAddedCount,
    createModelsChunkRequest
  };
}
