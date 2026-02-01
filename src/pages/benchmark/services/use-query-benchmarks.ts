import { useQueryDataList } from '@/hooks/use-query-data-list';
import { queryBenchmarkList } from '../apis';
import { BenchmarkListItem as ListItem } from '../config/types';

export const useQueryBenchmarkList = (optons?: {
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
}) => {
  const { dataList, loading, fetchData, cancelRequest } = useQueryDataList<
    ListItem,
    Global.SearchParams
  >({
    key: 'benchmarkList',
    fetchList: queryBenchmarkList
  });

  return {
    dataList,
    loading,
    fetchData,
    cancelRequest
  };
};

export default useQueryBenchmarkList;
