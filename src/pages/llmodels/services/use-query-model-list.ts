import { useQueryDataList } from '@gpustack/core-ui';
import { queryModelsList } from '../apis';
import { ListItem } from '../config/types';

export const useQueryModelList = (optons?: {
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
}) => {
  const { dataList, loading, fetchData, cancelRequest } = useQueryDataList<
    ListItem,
    Global.SearchParams
  >({
    key: 'modelList',
    fetchList: queryModelsList
  });

  return {
    dataList,
    loading,
    fetchData,
    cancelRequest
  };
};

export default useQueryModelList;
