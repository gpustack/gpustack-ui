import { HBarChart } from '@gpustack/core-ui/charts';
import { useIntl } from '@umijs/max';
import { usageChartHeight, usageRankMaxItems } from '../../config';
import type useTopTokenUsageByUser from '../../hooks/use-top-token-usage-by-user';
import UsageChartCard, { ChartLoadingBox } from './shared';

type RankData = ReturnType<typeof useTopTokenUsageByUser>['rankData'];

interface TopTokenUsageByUserProps {
  rankData: RankData;
  loading: boolean;
  height?: number;
  maxItems?: number;
}

const TopTokenUsageByUser: React.FC<TopTokenUsageByUserProps> = ({
  rankData,
  loading,
  height = usageChartHeight,
  maxItems = usageRankMaxItems
}) => {
  const intl = useIntl();

  return (
    <UsageChartCard
      title={intl.formatMessage({ id: 'dashboard.topTokenUsageByUser' })}
      height={height + 52}
    >
      {loading && rankData.names.length === 0 ? (
        <ChartLoadingBox height={height} />
      ) : (
        <HBarChart
          seriesData={rankData.series}
          xAxisData={rankData.names}
          height={height}
          maxItems={maxItems}
        />
      )}
    </UsageChartCard>
  );
};

export default TopTokenUsageByUser;
