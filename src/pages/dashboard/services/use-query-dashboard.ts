import { useQueryData } from '@/hooks/use-query-data-list';
import { omit } from 'lodash';
import { queryDashboardData } from '../apis';

export default function useQueryDashboard() {
  const { detailData, loading, fetchData, cancelRequest } = useQueryData({
    key: 'dashboard',
    fetchDetail: queryDashboardData,
    getData(response, params) {
      return params?.cluster_id
        ? {
            ...omit(detailData, ['system_load']),
            system_load: response.system_load
          }
        : response;
    }
  });

  return {
    loading,
    data: detailData,
    cancelRequest,
    fetchData
  };
}
