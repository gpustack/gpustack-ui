import { WatchEventType } from '@/config';
import _ from 'lodash';

interface ChunkedCollection {
  ids: string[];
  data: any;
  collection: any[];
  type: string | number;
}
// Only used to update lists without nested state
export function useUpdateChunkedList(options: {
  setDataList: (args: any) => void;
  callback?: (args: any) => void;
  filterFun?: (args: any) => boolean;
  mapFun?: (args: any) => any;
  computedID?: (d: object) => string;
}) {
  const updateChunkedList = (
    data: ChunkedCollection,
    dataList: { id: string | number }[]
  ) => {
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
      const newDataList = _.cloneDeep(dataList);
      _.each(collections, (item: any) => {
        const updateIndex = _.findIndex(
          dataList,
          (sItem: any) => sItem.id === item.id
        );
        if (updateIndex === -1) {
          const updateItem = _.cloneDeep(item);
          newDataList.push(updateItem);
        }
        console.log('create=========', updateIndex, dataList, collections);
      });
      options.setDataList?.(() => {
        return newDataList;
      });
    }
    // DELETE
    if (data?.type === WatchEventType.DELETE) {
      options.setDataList?.(() => {
        const updatedList = _.filter(dataList, (item: any) => {
          return !_.find(ids, (id: any) => id === item.id);
        });
        return updatedList;
      });
    }
    // UPDATE
    if (data?.type === WatchEventType.UPDATE) {
      options.setDataList?.(() => {
        const updatedDataList = _.cloneDeep(dataList);

        _.each(collections, (item: any) => {
          const updateIndex = _.findIndex(
            updatedDataList,
            (sItem: any) => sItem.id === item.id
          );
          if (updateIndex > -1) {
            const updateItem = _.cloneDeep(item);
            updatedDataList[updateIndex] = updateItem;
          } else if (updateIndex === -1) {
            const updateItem = _.cloneDeep(item);
            updatedDataList.push(updateItem);
          }
        });

        return updatedDataList;
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
