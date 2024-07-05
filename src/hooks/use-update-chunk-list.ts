import { WatchEventType } from '@/config';
import _ from 'lodash';

interface ChunkedCollection {
  ids: string[];
  data: any;
  collection: any[];
  type: string | number;
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
          options.setDataList((preDataList: any) => {
            return _.concat(updateItem, preDataList);
          });
        }
      });
    }
    // DELETE
    if (data?.type === WatchEventType.DELETE) {
      options.setDataList((prevDataList: any) => {
        const updatedList = _.filter(prevDataList, (item: any) => {
          return !_.find(ids, (id: any) => id === item.id);
        });
        return updatedList;
      });
    }
    // UPDATE
    if (data?.type === WatchEventType.UPDATE) {
      options.setDataList((prevDataList: any[]) => {
        const updatedDataList = _.cloneDeep(prevDataList);

        _.each(collections, (item: any) => {
          const updateIndex = _.findIndex(
            updatedDataList,
            (sItem: any) => sItem.id === item.id
          );
          if (updateIndex > -1) {
            const updateItem = _.cloneDeep(item);
            updatedDataList[updateIndex] = updateItem;
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
