import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import _ from 'lodash';
import { useRef, useState } from 'react';
import { WORKERS_API } from '../../resources/apis';

export default function useAddWorkerMessage(params: {
  startWatch?: React.RefObject<boolean>;
}) {
  const chunkRequestRef = useRef<any>(null);
  const newItemsRef = useRef<any[]>([]);
  const [addedCount, setAddedCount] = useState(0);

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
      if (params.startWatch?.current) {
        newItemsRef.current = newItemsRef.current.concat(newItems);
        console.log('newItemsRef.current:', newItemsRef.current);
        showAddWorkerMessage();
      }
    }
  });

  const updateHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const createModelsChunkRequest = async () => {
    chunkRequestRef.current?.current?.cancel?.();
    try {
      chunkRequestRef.current = setChunkRequest({
        url: WORKERS_API,
        handler: updateHandler
      });
    } catch (error) {
      // ignore
    }
  };

  return {
    addedCount,
    createModelsChunkRequest
  };
}
