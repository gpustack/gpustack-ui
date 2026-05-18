import useQueryTimeSeriesData from '@/pages/usage/services/use-query-timeseries-data';
import { useIntl } from '@umijs/max';
import { useEffect, useMemo } from 'react';
import {
  baseColorMap,
  DashboardUsageCommonParams,
  toUsageRankData
} from '../config';

export default function useTopTokenUsageByApiKey(
  commonParams: DashboardUsageCommonParams
) {
  const intl = useIntl();
  const query = useQueryTimeSeriesData({
    key: 'topTokenUsageByApiKeyData'
  });
  const tokenUsageText = intl.formatMessage({ id: 'dashboard.tokens' });

  useEffect(() => {
    query
      .fetchData({
        ...commonParams,
        metric: 'total_tokens',
        group_by: ['date', 'api_key'],
        page: 1,
        perPage: 10,
        sort_by: '-total_tokens'
      })
      .catch(() => {});
  }, [commonParams]);

  const rankData = useMemo(() => {
    const data = toUsageRankData(
      query.detailData,
      'api_key',
      tokenUsageText,
      baseColorMap.baseR3
    );
    return {
      names: data.names.filter((name) => name !== '-'),
      series: data.series.map((item) => ({
        ...item,
        data: item.data.filter((point) => point.name !== '-')
      }))
    };
  }, [query.detailData, tokenUsageText]);

  return {
    rankData,
    loading: query.loading
  };
}
