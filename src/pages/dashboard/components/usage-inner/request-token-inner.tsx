import CardWrapper from '@/components/card-wrapper';
import BarChart from '@/components/echarts/bar-chart';
import LineChart from '@/components/echarts/line-chart';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

interface RequestTokenInnerProps {
  requestData: {
    name: string;
    color: string;
    areaStyle: any;
    data: { time: string; value: number }[];
  }[];
  tokenData: { time: string; value: number }[];
  xAxisData: string[];
}
const RequestTokenInner: React.FC<RequestTokenInnerProps> = (props) => {
  console.log('request token inner=====================');
  const { requestData, tokenData, xAxisData } = props;
  const intl = useIntl();
  const labelFormatter = (v: any) => {
    return dayjs(v).format('MM-DD');
  };
  return (
    <CardWrapper style={{ width: '100%' }}>
      <Row style={{ width: '100%' }}>
        <Col span={12}>
          <LineChart
            title={intl.formatMessage({ id: 'dashboard.apirequest' })}
            seriesData={requestData}
            xAxisData={xAxisData}
            height={360}
            labelFormatter={labelFormatter}
          ></LineChart>
        </Col>
        <Col span={12}>
          <BarChart
            title={intl.formatMessage({ id: 'dashboard.tokens' })}
            seriesData={tokenData}
            xAxisData={xAxisData}
            height={360}
            labelFormatter={labelFormatter}
          ></BarChart>
        </Col>
      </Row>
    </CardWrapper>
  );
};

export default React.memo(RequestTokenInner);
