import CardWrapper from '@/components/card-wrapper';
import { SimpleCard } from '@/components/card-wrapper/simple-card';
import MixLineBar from '@/components/echarts/mix-line-bar';
import dayjs from 'dayjs';
import React from 'react';
import { baseColorMap } from '../../config';

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
  {
    label: '100M',
    value: 'Completion Tokens',
    iconType: 'roundRect',
    color: baseColorMap.base
  },
  {
    label: '50M',
    value: 'Prompt Tokens',
    iconType: 'roundRect',
    color: baseColorMap.baseR3
  },
  {
    label: '120K',
    value: 'API Requests',
    iconType: 'circle',
    color: baseColorMap.baseR1
  }
];

const legendData = [
  { name: 'Completion tokens', icon: 'roundRect' },
  { name: 'Prompt tokens', icon: 'roundRect' },
  { name: 'API requests', icon: 'circle' }
];

const RequestTokenInner: React.FC<RequestTokenInnerProps> = (props) => {
  const { requestData, tokenData, xAxisData } = props;

  return (
    <CardWrapper style={{ width: '100%' }}>
      <SimpleCard dataList={dataList} height={80}></SimpleCard>
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
