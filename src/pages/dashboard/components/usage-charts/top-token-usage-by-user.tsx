import useQueryTimeSeriesData from '@/pages/usage/services/use-query-timeseries-data';
import { HBarChart } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useEffect, useMemo } from 'react';
import {
  baseColorMap,
  DashboardUsageCommonParams,
  toUsageRankData,
  usageChartHeight
} from '../../config';
import UsageChartCard, { ChartLoadingBox } from './shared';

interface TopTokenUsageByUserProps {
  commonParams: DashboardUsageCommonParams;
  height?: number;
}

const TopTokenUsageByUser: React.FC<TopTokenUsageByUserProps> = ({
  commonParams,
  height = usageChartHeight
}) => {
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

  return (
    <UsageChartCard
      title={intl.formatMessage({ id: 'dashboard.topTokenUsageByUser' })}
      height={height + 52}
    >
      {query.loading && rankData.names.length === 0 ? (
        <ChartLoadingBox height={height} />
      ) : (
        <HBarChart
          seriesData={rankData.series}
          xAxisData={rankData.names}
          height={height}
          maxItems={10}
        />
      )}
    </UsageChartCard>
  );
};

export default TopTokenUsageByUser;
