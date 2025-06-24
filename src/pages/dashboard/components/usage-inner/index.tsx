import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import { FC, useContext, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { DASHBOARD_STATS_API } from '../../apis';
import { baseColorMap } from '../../config';
import { DashboardContext } from '../../config/dashboard-context';
import { DashboardUsageData } from '../../config/types';
import ExportData from './export-data';
import RequestTokenInner from './request-token-inner';
import TopUser from './top-user';
import useUsageData from './use-usage-data';

const TitleWrapper = styled.div`
  margin: 26px 0px;
  margin-bottom: 38px;
  font-weight: 700;
`;

const UsageInner: FC<{ paddingRight: string }> = ({ paddingRight }) => {
  const intl = useIntl();
  const { model_usage } = useContext(DashboardContext);

  const { usageData, handleOnCancel, handleExport, FilterBar, init, open } =
    useUsageData<DashboardUsageData>({
      url: DASHBOARD_STATS_API,
      defaultData: {
        api_request_history: [],
        completion_token_history: [],
        prompt_token_history: []
      }
    });

  const topUserData = useMemo(() => {
    const topUsers = model_usage?.top_users || [];

    const topUserPrompt: any = {
      name: 'Prompt tokens',
      color: baseColorMap.baseR3,
      data: [] as { name: string; value: number }[]
    };
    const topUserCompletion: any = {
      name: 'Completion tokens',
      color: baseColorMap.base,
      data: [] as { name: string; value: number }[]
    };

    const topUserNames = topUsers.map((item: any) => {
      topUserPrompt.data.push({
        name: item.username,
        value: item.prompt_token_count
      });
      topUserCompletion.data.push({
        name: item.username,
        value: item.completion_token_count
      });
      return item.username;
    });

    return {
      userData: [topUserCompletion, topUserPrompt],
      topUserList: [...new Set(topUserNames)] as string[]
    };
  }, [model_usage?.top_users]);

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <Row style={{ width: '100%' }} gutter={[0, 20]}>
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={16}
          style={{ paddingRight: paddingRight, marginTop: 12 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 0
            }}
          >
            <TitleWrapper>
              {intl.formatMessage({ id: 'dashboard.usage' })}
            </TitleWrapper>
            <FilterBar></FilterBar>
          </div>
          <RequestTokenInner
            onExport={handleExport}
            requestData={usageData?.requestTokenData.requestData}
            xAxisData={usageData?.requestTokenData.xAxisData}
            tokenData={usageData?.requestTokenData.tokenData}
          ></RequestTokenInner>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={8} style={{ marginTop: 12 }}>
          <TitleWrapper>
            {intl.formatMessage({ id: 'dashboard.topusers' })}
          </TitleWrapper>
          <TopUser
            userData={topUserData.userData}
            topUserList={topUserData.topUserList}
          ></TopUser>
        </Col>
      </Row>
      <ExportData open={open} onCancel={handleOnCancel}></ExportData>
    </div>
  );
};

export default UsageInner;
