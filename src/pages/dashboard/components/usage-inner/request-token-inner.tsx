import CardWrapper from '@/components/card-wrapper';
import { SimpleCard } from '@/components/card-wrapper/simple-card';
import MixLineBar from '@/components/echarts/mix-line-bar';
import { formatLargeNumber } from '@/utils';
import { Button } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { baseColorMap } from '../../config';

const DownloadButton = styled(Button).attrs({
  className: 'download-button'
})`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: none;
`;

const CardWrapperBox = styled.div`
  &:hover {
    .download-button {
      display: flex;
    }
  }
`;

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
  overViewData?: {
    requestCount: number;
    completionCount: number;
    promptCount: number;
  };
}

const labelFormatter = (v: any) => {
  return dayjs(v).format('MM-DD');
};

const dataList = [
  {
    label: '0',
    value: 'Completion Tokens',
    key: 'completionCount',
    iconType: 'roundRect',
    color: baseColorMap.base
  },
  {
    label: '0',
    value: 'Prompt Tokens',
    key: 'promptCount',
    iconType: 'roundRect',
    color: baseColorMap.baseR3
  },
  {
    label: '0',
    value: 'API Requests',
    key: 'requestCount',
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

  const totalData = useMemo(() => {
    const data: Record<string, number> = {
      requestCount:
        requestData[0]?.data.reduce((sum, item) => sum + item.value, 0) || 0,
      completionCount:
        tokenData[0]?.data.reduce((sum, item) => sum + item.value, 0) || 0,
      promptCount:
        tokenData[1]?.data.reduce((sum, item) => sum + item.value, 0) || 0
    };

    return dataList.map((item) => ({
      ...item,
      label: formatLargeNumber(data[item.key] || 0) as string
    }));
  }, [requestData, tokenData]);

  return (
    <CardWrapperBox>
      <CardWrapper style={{ width: '100%', position: 'relative' }}>
        <SimpleCard dataList={totalData} height={80}></SimpleCard>
        <MixLineBar
          chartData={{
            line: requestData,
            bar: tokenData
          }}
          seriesData={[]}
          xAxisData={xAxisData}
          height={360}
          smooth={false}
          legendData={legendData}
          labelFormatter={labelFormatter}
        ></MixLineBar>
      </CardWrapper>
    </CardWrapperBox>
  );
};

export default RequestTokenInner;
