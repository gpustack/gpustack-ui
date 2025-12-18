import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { WORKERS_API } from '../../resources/apis';

export default function useAddWorkerMessage() {
  const chunkRequestRef = useRef<any>(null);
  const newItemsRef = useRef<any[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const startWatchRef = useRef(false);
  const timerRef = useRef<any>(null);

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
    onCreate: (newItems: any) => {
      if (startWatchRef.current) {
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
    startWatchRef.current = false;
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
      timerRef.current = setTimeout(() => {
        startWatchRef.current = true;
      }, 5000);
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      chunkRequestRef.current?.current?.cancel?.();
      startWatchRef.current = false;
      newItemsRef.current = [];
      clearTimeout(timerRef.current);
    };
  }, []);

  return {
    addedCount,
    createModelsChunkRequest
  };
}
