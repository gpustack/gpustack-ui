import { WatchEventType } from '@/config';
import { useEffect, useRef } from 'react';

interface ChunkedCollection {
  ids: string[];
  data: any;
  collection: any[];
  type: string | number;
}
// Only used to update lists without nested state
export function useUpdateChunkedList(options: {
  dataList?: any[];
  limit?: number;
  setDataList: (args: any) => void;
  callback?: (args: any) => void;
  filterFun?: (args: any) => boolean;
  mapFun?: (args: any) => any;
  computedID?: (d: object) => string;
}) {
  const cacheDataListRef = useRef<any[]>(options.dataList || []);
  const timerRef = useRef<any>(null);
  const countRef = useRef<number>(0);
  const limit = options.limit || 10;

  useEffect(() => {
    cacheDataListRef.current = [...(options.dataList || [])];
  }, [options.dataList]);

  const debounceUpdateChunckedList = () => {
    // clearTimeout(timerRef.current);
    // timerRef.current = setTimeout(() => {
    //   options.setDataList?.([...cacheDataListRef.current]);
    // }, 80);
    options.setDataList?.([...cacheDataListRef.current]);
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
    const ids = data?.ids || [];
    // CREATE
    if (data?.type === WatchEventType.CREATE) {
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
    if (data?.type === WatchEventType.DELETE) {
      cacheDataListRef.current = cacheDataListRef.current?.filter(
        (item: any) => {
          return !ids?.includes(item.id);
        }
      );
      options.setDataList?.([...cacheDataListRef.current]);
    }
    // UPDATE
    if (data?.type === WatchEventType.UPDATE) {
      collections?.forEach((item: any) => {
        const updateIndex = cacheDataListRef.current?.findIndex(
          (sItem: any) => sItem.id === item.id
        );
        const updateItem = { ...item };
        if (updateIndex > -1) {
          cacheDataListRef.current[updateIndex] = updateItem;
        } else if (updateIndex === -1) {
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
    cacheDataListRef
  };
}

export default useUpdateChunkedList;
