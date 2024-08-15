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
const RequestTokenInner: React.FC<
  RequestTokenInnerProps & { paddingRight: string }
> = (props) => {
  console.log('request token inner=====================');
  const { requestData, tokenData, xAxisData, paddingRight } = props;
  const intl = useIntl();
  const labelFormatter = (v: any) => {
    return dayjs(v).format('MM-DD');
  };
  return (
    <Row style={{ width: '100%' }} gutter={[0, 20]}>
      <Col
        xs={24}
        sm={24}
        md={24}
        lg={24}
        xl={12}
        style={{ paddingRight: paddingRight }}
      >
        <CardWrapper style={{ width: '100%' }}>
          <LineChart
            title={intl.formatMessage({ id: 'dashboard.apirequest' })}
            seriesData={requestData}
            xAxisData={xAxisData}
            height={360}
            labelFormatter={labelFormatter}
          ></LineChart>
        </CardWrapper>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={12}>
        <CardWrapper style={{ width: '100%' }}>
          <BarChart
            title={intl.formatMessage({ id: 'dashboard.tokens' })}
            seriesData={tokenData}
            xAxisData={xAxisData}
            height={360}
            labelFormatter={labelFormatter}
          ></BarChart>
        </CardWrapper>
      </Col>
    </Row>
  );
};

export default React.memo(RequestTokenInner);
