import { WatchEventType } from '@/config';
import _ from 'lodash';

interface ChunkedCollection {
  ids: string[];
  collection: any[];
  type: string;
}
// Only used to update lists without nested state
export function useUpdateChunkedList(
  dataList: { id: string | number }[],
  options: {
    setDataList: (args: any) => void;
    callback?: (args: any) => void;
    filterFun?: (args: any) => boolean;
    mapFun?: (args: any) => any;
    computedID?: (d: object) => string;
  }
) {
  const updateChunkedList = (data: ChunkedCollection) => {
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
      _.each(collections, (item: any) => {
        const updateIndex = _.findIndex(
          dataList,
          (sItem: any) => sItem.id === item.id
        );
        if (updateIndex === -1) {
          const updateItem = _.cloneDeep(item);
          const list = _.concat(updateItem, dataList);
          options.setDataList(list);
        }
      });
    }
    // DELETE
    if (data?.type === WatchEventType.DELETE) {
      const list = _.filter(dataList, (item: any) => {
        return !_.find(ids, (id: any) => id === item.id);
      });
      options.setDataList(list);
    }
    // UPDATE
    if (data?.type === WatchEventType.UPDATE) {
      _.each(collections, (item: any) => {
        const updateIndex = _.findIndex(
          dataList,
          (sItem: any) => sItem.id === item.id
        );
        if (updateIndex > -1) {
          const updateItem = _.cloneDeep(item);
          dataList[updateIndex] = updateItem;
        }
        options.setDataList(dataList);
      });
    }
    if (options?.callback) {
      options?.callback(dataList);
    }
  };
  return {
    updateChunkedList
  };
}

export default useUpdateChunkedList;
