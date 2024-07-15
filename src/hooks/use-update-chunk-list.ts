import { WatchEventType } from '@/config';
import _ from 'lodash';
import { useRef } from 'react';

interface ChunkedCollection {
  ids: string[];
  data: any;
  collection: any[];
  type: string | number;
}
// Only used to update lists without nested state
export function useUpdateChunkedList(options: {
  dataList?: any[];
  setDataList: (args: any) => void;
  callback?: (args: any) => void;
  filterFun?: (args: any) => boolean;
  mapFun?: (args: any) => any;
  computedID?: (d: object) => string;
}) {
  const cacheDataListRef = useRef<any[]>(options.dataList || []);
  const updateChunkedList = (
    data: ChunkedCollection,
    dataList?: { id: string | number }[]
  ) => {
    console.log('updateChunkedList=====', {
      ids: data?.ids,
      type: data?.type,
      collection: data?.collection,
      dataList: _.map(dataList, (o: any) => o.id)
    });
    let collections = data?.collection || [];
    if (options?.computedID) {
      collections = _.map(collections, (item: any) => {
        item.id = options?.computedID?.(item);
        return item;
      });
    }
    if (options?.filterFun) {
      collections = _.filter(data?.collection, options?.filterFun);
    }
    if (options?.mapFun) {
      collections = _.map(data?.collection, options?.mapFun);
    }
    const ids = data?.ids || [];
    // CREATE
    if (data?.type === WatchEventType.CREATE) {
      const newDataList: any[] = [];
      _.each(collections, (item: any) => {
        const updateIndex = _.findIndex(
          cacheDataListRef.current,
          (sItem: any) => sItem.id === item.id
        );
        if (updateIndex === -1) {
          const updateItem = _.cloneDeep(item);
          newDataList.push(updateItem);
        }
        console.log('create=========', updateIndex, collections);
      });
      cacheDataListRef.current = [...newDataList, ...cacheDataListRef.current];
      options.setDataList?.([...cacheDataListRef.current]);
    }
    // DELETE
    if (data?.type === WatchEventType.DELETE) {
      cacheDataListRef.current = _.filter(
        cacheDataListRef.current,
        (item: any) => {
          return !_.includes(ids, item.id);
        }
      );
      // console.log('updateChunkedList=====delete', updatedList);
      // return updatedList;
      options.setDataList?.([...cacheDataListRef.current]);
    }
    // UPDATE
    if (data?.type === WatchEventType.UPDATE) {
      // const updatedDataList = _.cloneDeep(dataList);
      _.each(collections, (item: any) => {
        const updateIndex = _.findIndex(
          cacheDataListRef.current,
          (sItem: any) => sItem.id === item.id
        );
        if (updateIndex > -1) {
          const updateItem = _.cloneDeep(item);
          cacheDataListRef.current[updateIndex] = updateItem;
        } else if (updateIndex === -1) {
          const updateItem = _.cloneDeep(item);
          cacheDataListRef.current.push(updateItem);
        }
      });
      console.log('updateChunkedList=====update', cacheDataListRef.current);
      options.setDataList?.([...cacheDataListRef.current]);
    }
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
