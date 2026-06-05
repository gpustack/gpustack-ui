import { useQueryDataList } from '@gpustack/core-ui';
import { queryWorkersList } from '../apis';
import { ListItem } from '../config/types';

export const useQueryWorkerList = (optons?: {
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
}) => {
  const { dataList, loading, fetchData, cancelRequest } = useQueryDataList<
    ListItem,
    Global.SearchParams
  >({
    key: 'workerList',
    fetchList: queryWorkersList
  });

  return {
    dataList,
    loading,
    fetchData,
    cancelRequest
  };
};

export default useQueryWorkerList;
