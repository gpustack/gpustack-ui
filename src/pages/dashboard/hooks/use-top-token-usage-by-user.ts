import useQueryTimeSeriesData from '@/pages/usage/services/use-query-timeseries-data';
import { useEffect, useMemo } from 'react';
import {
  baseColorMap,
  DashboardUsageCommonParams,
  toUsageTokenBreakdownData
} from '../config';

export default function useTopTokenUsageByUser(
  commonParams: DashboardUsageCommonParams
) {
  const query = useQueryTimeSeriesData({
    key: 'topTokenUsageByUserData'
  });

  useEffect(() => {
    query
      .fetchData({
        ...commonParams,
        metric: 'total_tokens',
        group_by: ['user'],
        page: 1,
        perPage: 10,
        sort_by: '-total_tokens'
      })
      .catch(() => {});
  }, [commonParams]);

  const rankData = useMemo(
    () =>
      toUsageTokenBreakdownData(query.detailData, 'user', [
        {
          name: 'Prompt Tokens',
          key: 'input_tokens',
          color: baseColorMap.base
        },
        {
          name: 'Completion Tokens',
          key: 'output_tokens',
          color: baseColorMap.baseR3
        }
      ]),
    [query.detailData]
  );

  return {
    rankData,
    loading: query.loading
  };
}
