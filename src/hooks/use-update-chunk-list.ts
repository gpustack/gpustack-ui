import { WatchEventType } from '@/config';
import { useEffect, useRef } from 'react';

interface ChunkedCollection {
  ids: string[] | number[];
  data: any;
  collection: any[];
  type: string | number;
}

type EventsType = 'CREATE' | 'UPDATE' | 'DELETE' | 'INSERT';

// Only used to update lists without nested state
export function useUpdateChunkedList(options: {
  events?: EventsType[];
  dataList?: any[];
  limit?: number;
  setDataList: (args: any, opts?: any) => void;
  callback?: (args: any) => void;
  filterFun?: (args: any) => boolean;
  mapFun?: (args: any) => any;
  computedID?: (d: object) => string;
}) {
  const { events = ['CREATE', 'DELETE', 'UPDATE', 'INSERT'] } = options;
  const deletedIdsRef = useRef<Set<number | string>>(new Set());
  const cacheDataListRef = useRef<any[]>(options.dataList || []);
  const timerRef = useRef<any>(null);
  const limit = options.limit || 10;

  useEffect(() => {
    cacheDataListRef.current = [...(options.dataList || [])];
  }, [options.dataList]);

  const setDeletedIds = (ids: number[]) => {
    deletedIdsRef.current = new Set([...deletedIdsRef.current, ...ids]);
  };
  const debounceUpdateChunckedList = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      options.setDataList?.([...cacheDataListRef.current]);
    }, 200);
  };
  const updateChunkedList = (data: ChunkedCollection) => {
    console.log('updateChunkedList=====', {
      ids: data?.ids,
      type: data?.type,
      collection: data?.collection
    });
    let collections = data?.collection || [];
    if (options?.computedID) {
      collections = collections?.map((item: any) => {
        item.id = options?.computedID?.(item);
        return item;
      });
    }
    if (options?.filterFun) {
      collections = data?.collection?.filter(options?.filterFun);
    }
    if (options?.mapFun) {
      collections = data?.collection?.map(options?.mapFun);
    }
    const ids: any[] = data?.ids || [];
    // CREATE
    if (data?.type === WatchEventType.CREATE && events.includes('CREATE')) {
      const newDataList = collections.reduce((acc: any[], item: any) => {
        const updateIndex = cacheDataListRef.current?.findIndex(
          (sItem: any) => sItem.id === item.id
        );
        const updateItem = { ...item };
        if (updateIndex === -1) {
          acc.push(updateItem);
        } else {
          cacheDataListRef.current[updateIndex] = updateItem;
        }

        return acc;
      }, []);
      cacheDataListRef.current = [
        ...newDataList,
        ...cacheDataListRef.current
      ].slice(0, limit);
    }
    // DELETE
    if (data?.type === WatchEventType.DELETE && events.includes('DELETE')) {
      cacheDataListRef.current = cacheDataListRef.current?.filter(
        (item: any) => {
          return !ids?.includes(item.id);
        }
      );
      setDeletedIds(ids as number[]);
      options.setDataList?.([...cacheDataListRef.current], {
        deletedIds: [...deletedIdsRef.current]
      });
    }
    // UPDATE
    if (data?.type === WatchEventType.UPDATE && events.includes('UPDATE')) {
      collections?.forEach((item: any) => {
        const updateIndex = cacheDataListRef.current?.findIndex(
          (sItem: any) => sItem.id === item.id
        );
        const updateItem = { ...item };
        if (updateIndex > -1) {
          cacheDataListRef.current[updateIndex] = updateItem;
        } else if (updateIndex === -1 && events.includes('INSERT')) {
          cacheDataListRef.current = [
            updateItem,
            ...cacheDataListRef.current.slice(0, limit - 1)
          ];
        }
      });
    }

    debounceUpdateChunckedList();
    if (options?.callback) {
      options?.callback(cacheDataListRef.current);
    }
  };
  return {
    updateChunkedList,
    cacheDataListRef,
    deletedIdsRef
  };
}

export default useUpdateChunkedList;
