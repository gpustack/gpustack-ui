import PieChart from '@/pages/_components/pie-chart';
import { UsageBreakdownResponse } from '@/pages/usage/config/types';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import {
  getUsageSummary,
  toUsagePieData,
  usageChartHeight
} from '../../config';
import UsageChartCard from './shared';

interface TokenUsageByModelProps {
  data: UsageBreakdownResponse | null | undefined;
  loading?: boolean;
}

const TokenUsageByModel: React.FC<TokenUsageByModelProps> = ({
  data,
  loading = false
}) => {
  const intl = useIntl();

  const chartData = useMemo(
    () => toUsagePieData(data, 'model', 'total_tokens'),
    [data]
  );

  const total = useMemo(() => {
    const summary = getUsageSummary(data);
    return Number(summary?.total_tokens ?? 0);
  }, [data]);

  return (
    <UsageChartCard
      title={intl.formatMessage({ id: 'dashboard.tokenUsageByModel' })}
    >
      <PieChart
        data={chartData}
        height={usageChartHeight}
        loading={loading}
        colorOffset={2}
        total={total}
      />
    </UsageChartCard>
  );
};

export default TokenUsageByModel;
