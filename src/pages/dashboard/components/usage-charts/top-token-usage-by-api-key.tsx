import { HBarChart } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { usageChartHeight, usageRankMaxItems } from '../../config';
import type useTopTokenUsageByApiKey from '../../hooks/use-top-token-usage-by-api-key';
import UsageChartCard, { ChartLoadingBox } from './shared';

type RankData = ReturnType<typeof useTopTokenUsageByApiKey>['rankData'];

interface TopTokenUsageByApiKeyProps {
  rankData: RankData;
  loading: boolean;
  height?: number;
  maxItems?: number;
}

const TopTokenUsageByApiKey: React.FC<TopTokenUsageByApiKeyProps> = ({
  rankData,
  loading,
  height = usageChartHeight,
  maxItems = usageRankMaxItems
}) => {
  const intl = useIntl();

  return (
    <UsageChartCard
      title={intl.formatMessage({ id: 'dashboard.topTokenUsageByApiKey' })}
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

export default TopTokenUsageByApiKey;
