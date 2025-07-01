import breakpoints from '@/config/breakpoints';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import { FC, useContext, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { DASHBOARD_STATS_API } from '../../apis';
import { baseColorMap } from '../../config';
import { DashboardContext } from '../../config/dashboard-context';
import { DashboardUsageData } from '../../config/types';
import ExportData from './export-data';
import FilterBar from './filter-bar';
import RequestTokenInner from './request-token-inner';
import TopUser from './top-user';
import useUsageData from './use-usage-data';

const TitleWrapper = styled.div`
  margin: 0;
  font-weight: 700;
`;

const UsageInner: FC<{ maxWidth: number }> = ({ maxWidth }) => {
  const intl = useIntl();
  const { model_usage } = useContext(DashboardContext);

  const {
    usageData,
    query,
    userList,
    modelList,
    handleOnCancel,
    init,
    handleExport,
    handleDateChange,
    handleUsersChange,
    handleModelsChange,
    open
  } = useUsageData<DashboardUsageData>({
    url: DASHBOARD_STATS_API,
    disabledDate: true,
    defaultData: {
      api_request_history: [],
      completion_token_history: [],
      prompt_token_history: []
    }
  });

  const topUserData = useMemo(() => {
    // top 10 users
    const topUsers = model_usage?.top_users?.slice(0, 10) || [];

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
        value: item.prompt_token_count,
        itemStyle: {
          borderRadius: !item.completion_token_count
            ? [2, 2, 2, 2]
            : [0, 2, 2, 0]
        }
      });
      topUserCompletion.data.push({
        name: item.username,
        value: item.completion_token_count,
        itemStyle: {
          borderRadius: !item.prompt_token_count ? [2, 2, 2, 2] : [2, 0, 0, 2]
        }
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
      <Row
        style={{ width: '100%' }}
        gutter={maxWidth < breakpoints.xl ? [0, 0] : [0, 20]}
      >
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={16}
          style={{
            paddingRight: maxWidth < breakpoints.xl ? 0 : 20
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '20px 0 '
            }}
          >
            <TitleWrapper>
              {intl.formatMessage({ id: 'dashboard.usage' })}
            </TitleWrapper>
            <FilterBar
              url={DASHBOARD_STATS_API}
              query={query}
              userList={userList}
              modelList={modelList}
              disabledDate={true}
              handleDateChange={handleDateChange}
              handleUsersChange={handleUsersChange}
              handleModelsChange={handleModelsChange}
              handleExport={handleExport}
            ></FilterBar>
          </div>
          <RequestTokenInner
            requestData={usageData?.requestTokenData.requestData}
            xAxisData={usageData?.requestTokenData.xAxisData}
            tokenData={usageData?.requestTokenData.tokenData}
          ></RequestTokenInner>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={8} style={{ margin: 0 }}>
          <div
            style={{ margin: maxWidth < breakpoints.xl ? '26px 0' : '32px 0' }}
          >
            <TitleWrapper>
              {intl.formatMessage({ id: 'dashboard.topusers' })}
            </TitleWrapper>
          </div>
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
