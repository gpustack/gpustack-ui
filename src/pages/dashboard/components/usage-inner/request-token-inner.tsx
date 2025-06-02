import CardWrapper from '@/components/card-wrapper';
import MixLineBar from '@/components/echarts/mix-line-bar';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';

interface RequestTokenInnerProps {
  requestData: {
    name: string;
    color: string;
    areaStyle: any;
    data: { time: string; value: number }[];
  }[];
  tokenData: {
    data: { time: string; value: number }[];
  }[];
  xAxisData: string[];
}

const labelFormatter = (v: any) => {
  return dayjs(v).format('MM-DD');
};

const dataList = [
  { label: '100M', value: 'Completion Tokens' },
  { label: '50M', value: 'Prompt Tokens' },
  { label: '120K', value: 'API Requests' }
];

const legendData = [
  { name: 'Completion tokens', icon: 'roundRect' },
  { name: 'Prompt tokens', icon: 'roundRect' },
  { name: 'API requests', icon: 'circle' }
];

const RequestTokenInner: React.FC<RequestTokenInnerProps> = (props) => {
  const { requestData, tokenData, xAxisData } = props;
  const intl = useIntl();

  return (
    <CardWrapper style={{ width: '100%' }}>
      {/* <Row style={{ width: '100%' }}>
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
      </Row> */}
      {/* <SimpleCard dataList={dataList} height={80}></SimpleCard> */}
      <MixLineBar
        chartData={{
          line: requestData,
          bar: tokenData
        }}
        seriesData={[]}
        xAxisData={xAxisData}
        height={360}
        smooth={true}
        legendData={legendData}
        labelFormatter={labelFormatter}
      ></MixLineBar>
    </CardWrapper>
  );
};

export default React.memo(RequestTokenInner);
