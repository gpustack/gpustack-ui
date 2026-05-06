import { activeModelsAtom } from '@/atoms/dashboard';
import useQueryBreakdownList from '@/pages/usage/services/use-query-breakdown-list';
import useQueryTimeSeriesData from '@/pages/usage/services/use-query-timeseries-data';
import { formatLargeNumber } from '@/utils';
import { PageTools } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useContext, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  baseColorMap,
  DashboardUsageCommonParams,
  getUsageSummary
} from '../config';
import { DashboardContext } from '../config/dashboard-context';
import ApiRequestsByModel from './usage-charts/api-requests-by-model';
import TokenUsageByModel from './usage-charts/token-usage-by-model';
import TopTokenUsageByApiKey from './usage-charts/top-token-usage-by-api-key';
import TopTokenUsageByUser from './usage-charts/top-token-usage-by-user';

const Section = styled.div`
  margin-top: 16px;
`;

const NewUsage = () => {
  const intl = useIntl();
  const activeModelsFromAtom = useAtomValue(activeModelsAtom);
  const { active_models: activeModelsFromContext = [] } =
    useContext(DashboardContext);
  const tokenByModelQuery = useQueryTimeSeriesData({
    key: 'tokenUsageByModelData'
  });
  const activeUsersQuery = useQueryBreakdownList({
    key: 'dashboardActiveUsersData'
  });

  const dateRange = useMemo(
    () => ({
      start_date: dayjs().subtract(29, 'days').format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD')
    }),
    []
  );

  const commonParams = useMemo<DashboardUsageCommonParams>(
    () => ({
      ...dateRange,
      scope: 'all',
      granularity: 'day',
      filters: {}
    }),
    [dateRange]
  );

  const activeModels = activeModelsFromAtom.length
    ? activeModelsFromAtom
    : activeModelsFromContext;

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        tokenByModelQuery.fetchData({
          ...commonParams,
          metric: 'total_tokens',
          group_by: ['date', 'model'],
          sort_by: '-total_tokens'
        }),
        activeUsersQuery.fetchData({
          ...dateRange,
          scope: 'all',
          group_by: ['user'],
          page: 1,
          perPage: 10,
          sort_by: '-total_tokens',
          filters: {}
        })
      ]);
    };

    fetchData().catch(() => {});
  }, [commonParams, dateRange]);

  const summaryCards = useMemo(() => {
    const summary = getUsageSummary(tokenByModelQuery.detailData) || {
      total_tokens: 0,
      api_requests: 0
    };

    return [
      {
        label: formatLargeNumber(summary.total_tokens) as string,
        value: intl.formatMessage({ id: 'dashboard.tokens' }),
        color: baseColorMap.base
      },
      {
        label: formatLargeNumber(summary.api_requests) as string,
        value: intl.formatMessage({ id: 'dashboard.apirequest' }),
        color: baseColorMap.baseR1
      },
      {
        label: formatLargeNumber(activeModels.length) as string,
        value: intl.formatMessage({ id: 'dashboard.activeModels' }),
        color: baseColorMap.baseR2
      },
      {
        label: formatLargeNumber(activeUsersQuery.dataSource.total) as string,
        value: intl.formatMessage({ id: 'dashboard.activeUsers' }),
        color: baseColorMap.baseR3
      }
    ];
  }, [
    activeModels.length,
    activeUsersQuery.dataSource.total,
    intl,
    tokenByModelQuery.detailData
  ]);

  return (
    <>
      <PageTools
        style={{ margin: '24px 0 0' }}
        left={
          <span className="font-700">
            {intl.formatMessage({ id: 'dashboard.usage' })}
          </span>
        }
      />
      <Section>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={24} md={24} lg={12}>
            <TokenUsageByModel
              data={tokenByModelQuery.detailData}
              loading={tokenByModelQuery.loading}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12}>
            <ApiRequestsByModel commonParams={commonParams} />
          </Col>
        </Row>
      </Section>
      <Section>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={24} md={24} lg={12}>
            <TopTokenUsageByUser commonParams={commonParams} height={450} />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12}>
            <TopTokenUsageByApiKey commonParams={commonParams} height={450} />
          </Col>
        </Row>
      </Section>
    </>
  );
};

export default NewUsage;
