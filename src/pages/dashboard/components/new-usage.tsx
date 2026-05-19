import { PageTools } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import styled from 'styled-components';
import {
  DashboardUsageCommonParams,
  getUsageRankHeight,
  getUsageRankSlotCount
} from '../config';
import useTopTokenUsageByUser from '../hooks/use-top-token-usage-by-user';
import TopTokenUsageByUser from './usage-charts/top-token-usage-by-user';
import UsageByModel from './usage-charts/usage-by-model';

const Section = styled.div`
  margin-top: 16px;
`;

const NewUsage = () => {
  const intl = useIntl();

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

  const userUsage = useTopTokenUsageByUser(commonParams);

  const userCount = userUsage.rankData.names.length;
  const rankHeight = getUsageRankHeight(userCount);
  const rankMaxItems = Math.max(getUsageRankSlotCount(rankHeight), userCount);

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
          <Col xs={24} sm={24} md={24} lg={24} xl={16}>
            <UsageByModel commonParams={commonParams} height={rankHeight} />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={8}>
            <TopTokenUsageByUser
              rankData={userUsage.rankData}
              loading={userUsage.loading}
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
