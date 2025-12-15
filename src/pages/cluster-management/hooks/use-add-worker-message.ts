import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import _ from 'lodash';
import { useRef } from 'react';
import { WORKERS_API } from '../../resources/apis';

export default function useAddWorkerMessage(params: {
  startWatch?: React.RefObject<boolean>;
}) {
  const chunkRequestRef = useRef<any>(null);
  const newItemsRef = useRef<any[]>([]);
  const intl = useIntl();
  const [messageApi, contextHolder] = message.useMessage();

  const showAddWorkerMessage = _.debounce(() => {
    if (newItemsRef.current.length > 0) {
      const count = newItemsRef.current.length;
      messageApi.success(
        intl.formatMessage(
          { id: 'clusters.addworker.message.success' },
          { count }
        )
      );
      newItemsRef.current = [];
    }
  }, 300);

  const { setChunkRequest } = useSetChunkRequest();
  const { updateChunkedList } = useUpdateChunkedList({
    events: ['CREATE', 'INSERT'],
    dataList: [],
    onCreate: (newItems: any) => {
      if (params.startWatch?.current) {
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
    contextHolder,
    createModelsChunkRequest
  };
}
