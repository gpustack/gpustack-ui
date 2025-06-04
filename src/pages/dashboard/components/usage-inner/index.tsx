import { SimpleCard } from '@/components/card-wrapper/simple-card';
import PageTools from '@/components/page-tools';
import { ExportOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Col, DatePicker, Row, Select } from 'antd';
import { FC, memo, useContext, useState } from 'react';
import styled from 'styled-components';
import { DashboardContext } from '../../config/dashboard-context';
import ExportData from './export-data';
import RequestTokenInner from './request-token-inner';
import TopUser from './top-user';
import useUsageData from './use-usage-data';

const FilterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  .selection {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const TitleWrapper = styled.div`
  margin: 26px 0px;
  font-weight: 700;
`;

const dataList = [
  { label: '100M', value: 'Completion Tokens' },
  { label: '50M', value: 'Prompt Tokens' },
  { label: '120K', value: 'API Requests' }
];

const UsageInner: FC<{ paddingRight: string }> = ({ paddingRight }) => {
  const intl = useIntl();

  const { model_usage } = useContext(DashboardContext);
  const [open, setOpen] = useState(false);

  const { requestTokenData, topUserData } = useUsageData(model_usage || {});

  const handleOnCancel = () => {
    setOpen(false);
  };

  const handleExport = () => {
    setOpen(true);
  };

  return (
    <div>
      <PageTools style={{ margin: '0px 0px' }} left={false} />
      <Row style={{ width: '100%' }} gutter={[0, 20]}>
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={16}
          style={{ paddingRight: paddingRight }}
        >
          <TitleWrapper>
            {intl.formatMessage({ id: 'dashboard.usage' })}
          </TitleWrapper>
          <FilterWrapper>
            <div className="selection">
              <DatePicker.RangePicker
                style={{ width: 240 }}
              ></DatePicker.RangePicker>
              <Select
                mode="multiple"
                maxTagCount={1}
                placeholder={intl.formatMessage({
                  id: 'dashboard.usage.selectuser'
                })}
                style={{ width: 160 }}
              ></Select>
              <Select
                mode="multiple"
                maxTagCount={1}
                placeholder={intl.formatMessage({
                  id: 'dashboard.usage.selectmodel'
                })}
                style={{ width: 160 }}
              ></Select>
            </div>
            <Button
              type="text"
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              {intl.formatMessage({ id: 'common.button.export' })}
            </Button>
          </FilterWrapper>
          <SimpleCard
            dataList={dataList}
            height={80}
            bordered={true}
          ></SimpleCard>
          <RequestTokenInner
            requestData={requestTokenData.requestData}
            xAxisData={requestTokenData.xAxisData}
            tokenData={requestTokenData.tokenData}
          ></RequestTokenInner>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={8}>
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

export default memo(UsageInner);
