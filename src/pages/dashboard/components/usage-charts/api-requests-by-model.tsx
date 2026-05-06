import PieChart from '@/pages/_components/pie-chart';
import useQueryTimeSeriesData from '@/pages/usage/services/use-query-timeseries-data';
import { useIntl } from '@umijs/max';
import { useEffect, useMemo } from 'react';
import {
  DashboardUsageCommonParams,
  getUsageSummary,
  toUsagePieData,
  usageChartHeight
} from '../../config';
import UsageChartCard from './shared';

interface ApiRequestsByModelProps {
  commonParams: DashboardUsageCommonParams;
}

const ApiRequestsByModel: React.FC<ApiRequestsByModelProps> = ({
  commonParams
}) => {
  const intl = useIntl();
  const query = useQueryTimeSeriesData({
    key: 'apiRequestsByModelData'
  });

  useEffect(() => {
    query
      .fetchData({
        ...commonParams,
        metric: 'api_requests',
        group_by: ['date', 'model'],
        page: 1,
        perPage: 10,
        sort_by: '-api_requests'
      })
      .catch(() => {});
  }, [commonParams]);

  const chartData = useMemo(
    () => toUsagePieData(query.detailData, 'model', 'api_requests'),
    [query.detailData]
  );

  const total = useMemo(() => {
    const summary = getUsageSummary(query.detailData);
    return Number(summary?.api_requests ?? 0);
  }, [query.detailData]);

  return (
    <UsageChartCard
      title={intl.formatMessage({ id: 'dashboard.apiRequestsByModel' })}
    >
      <PieChart
        data={chartData}
        height={usageChartHeight}
        loading={query.loading}
        colorOffset={1}
        total={total}
      />
    </UsageChartCard>
  );
};

export default ApiRequestsByModel;
