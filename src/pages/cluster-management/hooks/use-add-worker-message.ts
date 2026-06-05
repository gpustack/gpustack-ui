import { workerAddedCountAtom } from '@/atoms/clusters';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import useQueryWorkerList from '@/pages/resources/services/use-query-worker-list';
import { useAtom } from 'jotai';
import _ from 'lodash';
import qs from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { WORKERS_API } from '../../resources/apis';

export default function useAddWorkerMessage() {
  const chunkRequestRef = useRef<any>(null);
  const newItemsRef = useRef<any[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const timerRef = useRef<any>(null);
  const triggerAtRef = useRef<number>(0);
  const existingIdsRef = useRef<Set<string | number>>(new Set());
  const snapshotReceivedRef = useRef<boolean>(false);
  const [, setWorkerAddedCount] = useAtom(workerAddedCountAtom);
  // fetchData auto-cancels any in-flight request on each call and on unmount,
  // so a stale seed from a previous open/cluster can't leak in
  const { fetchData: fetchWorkerList, cancelRequest: cancelWorkerListRequest } =
    useQueryWorkerList();

  const isNewWorker = (item: any) => {
    console.log(
      'isNewWorker item:',
      item,
      existingIdsRef.current,
      snapshotReceivedRef.current
    );
    if (item?.id == null) {
      return false;
    }
    if (existingIdsRef.current.has(item.id)) {
      return false;
    }
    existingIdsRef.current.add(item.id);
    // before the full snapshot has been received, every item is pre-existing
    return snapshotReceivedRef.current;
  };

  const updateAddedCount = (count: number) => {
    setAddedCount(count);
    setWorkerAddedCount(count);
  };
  const showAddWorkerMessage = () => {
    if (newItemsRef.current.length > 0) {
      const count = newItemsRef.current.length;
      updateAddedCount(count);
    }
  };

  const { setChunkRequest } = useSetChunkRequest();
  const { updateChunkedList } = useUpdateChunkedList({
    events: ['CREATE', 'INSERT'],
    dataList: [],
    isNewItem: isNewWorker,
    onCreate: (newItems: any) => {
      console.log('onCreate newItems:', newItems, triggerAtRef.current);
      if (triggerAtRef.current) {
        newItemsRef.current = newItemsRef.current.concat(newItems);
        showAddWorkerMessage();
      }
    },
    onUpdate: (newItems: any) => {
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
    // fallback: if seeding the baseline failed, the first watch chunk marks the
    // snapshot as received (only reliable when there is at least one worker)
    snapshotReceivedRef.current = true;
  };

  // Seed the baseline set of already-existing worker ids via REST before the
  // watch starts. Relying on the watch's first chunk fails when a cluster has
  // zero workers (no CREATE event is sent, so the snapshot flag never flips and
  // genuinely new workers get misclassified as pre-existing).
  const seedExistingWorkers = async (params: Record<string, any>) => {
    try {
      const items = await fetchWorkerList({ ...params, page: -1 } as any);
      (items || []).forEach((item: any) => {
        if (item?.id != null) {
          existingIdsRef.current.add(item.id);
        }
      });
      snapshotReceivedRef.current = true;
    } catch (error) {
      // ignore: fall back to the first watch chunk (see updateHandler)
    }
  };

  const resetAddedCount = () => {
    updateAddedCount(0);
    chunkRequestRef.current?.current?.cancel?.();
    newItemsRef.current = [];
    triggerAtRef.current = 0;
    existingIdsRef.current = new Set();
    snapshotReceivedRef.current = false;
    // cancel any in-flight seed request
    cancelWorkerListRequest();
    clearTimeout(timerRef.current);
  };

  const createModelsChunkRequest = async (params = {}) => {
    resetAddedCount();
    // seed the baseline before watching so new workers are detected even when
    // the cluster currently has zero workers
    await seedExistingWorkers(params);
    try {
      chunkRequestRef.current = setChunkRequest({
        url: `${WORKERS_API}?${qs.stringify(_.pickBy(params, (val: any) => !!val))}`,
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
