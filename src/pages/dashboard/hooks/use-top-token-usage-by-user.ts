import useQueryTimeSeriesData from '@/pages/usage/services/use-query-timeseries-data';
import { useIntl } from '@umijs/max';
import { useEffect, useMemo } from 'react';
import {
  baseColorMap,
  DashboardUsageCommonParams,
  toUsageRankData
} from '../config';

export default function useTopTokenUsageByUser(
  commonParams: DashboardUsageCommonParams
) {
  const intl = useIntl();
  const query = useQueryTimeSeriesData({
    key: 'topTokenUsageByUserData'
  });
  const tokenUsageText = intl.formatMessage({ id: 'dashboard.tokens' });

  useEffect(() => {
    query
      .fetchData({
        ...commonParams,
        metric: 'total_tokens',
        group_by: ['date', 'user'],
        page: 1,
        perPage: 10,
        sort_by: '-total_tokens'
      })
      .catch(() => {});
  }, [commonParams]);

  const rankData = useMemo(
    () =>
      toUsageRankData(
        query.detailData,
        'user',
        tokenUsageText,
        baseColorMap.base
      ),
    [query.detailData, tokenUsageText]
  );

  return {
    rankData,
    loading: query.loading
  };
}
