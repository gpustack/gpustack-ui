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

interface TopTokenUsageByApiKeyProps {
  commonParams: DashboardUsageCommonParams;
  height?: number;
}

const TopTokenUsageByApiKey: React.FC<TopTokenUsageByApiKeyProps> = ({
  commonParams,
  height = usageChartHeight
}) => {
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

  return (
    <UsageChartCard
      title={intl.formatMessage({ id: 'dashboard.topTokenUsageByApiKey' })}
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

export default TopTokenUsageByApiKey;
