import { useQueryDataList } from '@/hooks/use-query-data-list';
import { queryRouteTargets } from '../apis';
import { RouteTarget as ListItem } from '../config/types';

export const useQueryRouteTargets = (optons?: {
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
}) => {
  const { dataList, loading, fetchData, cancelRequest } =
    useQueryDataList<ListItem>({
      key: 'routeTargets',
      fetchList: queryRouteTargets
    });

  return {
    dataList,
    loading,
    fetchData,
    cancelRequest
  };
};

export default useQueryRouteTargets;
