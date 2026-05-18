import useQueryTimeSeriesData from '@/pages/usage/services/use-query-timeseries-data';
import { PageTools } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  DashboardUsageCommonParams,
  getUsageRankHeight,
  getUsageRankSlotCount
} from '../config';
import useTopTokenUsageByApiKey from '../hooks/use-top-token-usage-by-api-key';
import useTopTokenUsageByUser from '../hooks/use-top-token-usage-by-user';
import ApiRequestsByModel from './usage-charts/api-requests-by-model';
import TokenUsageByModel from './usage-charts/token-usage-by-model';
import TopTokenUsageByApiKey from './usage-charts/top-token-usage-by-api-key';
import TopTokenUsageByUser from './usage-charts/top-token-usage-by-user';

const Section = styled.div`
  margin-top: 16px;
`;

const NewUsage = () => {
  const intl = useIntl();
  const tokenByModelQuery = useQueryTimeSeriesData({
    key: 'tokenUsageByModelData'
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

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        tokenByModelQuery.fetchData({
          ...commonParams,
          metric: 'total_tokens',
          group_by: ['date', 'model'],
          sort_by: '-total_tokens'
        })
      ]);
    };

    fetchData().catch(() => {});
  }, [commonParams, dateRange]);

  const userUsage = useTopTokenUsageByUser(commonParams);
  const apiKeyUsage = useTopTokenUsageByApiKey(commonParams);

  const userCount = userUsage.rankData.names.length;
  const apiKeyCount = apiKeyUsage.rankData.names.length;

  const rankHeight = Math.max(
    getUsageRankHeight(userCount),
    getUsageRankHeight(apiKeyCount)
  );

  const rankMaxItems = Math.max(
    getUsageRankSlotCount(rankHeight),
    userCount,
    apiKeyCount
  );

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
            <TopTokenUsageByUser
              rankData={userUsage.rankData}
              loading={userUsage.loading}
              height={rankHeight}
              maxItems={rankMaxItems}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12}>
            <TopTokenUsageByApiKey
              rankData={apiKeyUsage.rankData}
              loading={apiKeyUsage.loading}
              height={rankHeight}
              maxItems={rankMaxItems}
            />
          </Col>
        </Row>
      </Section>
    </>
  );
};

export default NewUsage;
