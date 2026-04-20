import CardWrapper from '@/components/card-wrapper';
import MixLineBar from '@/components/echarts/mix-line-bar';
import BaseSelect from '@/components/seal-form/base/select';
import { baseColorMap } from '@/pages/dashboard/config';
import { formatLargeNumber } from '@/utils';
import { Segmented } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { granularities, groupByOptions, metricOptions } from '../config';
import { TimeSeriesData } from '../config/types';

const ControlsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  .group {
    display: flex;
    gap: 8px;
    align-items: center;
  }
`;

const ControlLabel = styled.span`
  font-size: 14px;
  color: var(--ant-color-text-tertiary);
  margin-right: 8px;
`;

interface DailyUsageProps {
  timeSeriesData: TimeSeriesData | null;
  metric: string;
  groupBy: string;
  granularity: string;
  onMetricChange: (value: string) => void;
  onGroupByChange: (value: string) => void;
  onGranularityChange: (value: string) => void;
}

const labelFormatter = (v: any) => {
  return dayjs(v).format('MM-DD');
};

const DailyUsage: React.FC<DailyUsageProps> = (props) => {
  const {
    timeSeriesData,
    metric,
    groupBy,
    granularity,
    onMetricChange,
    onGroupByChange,
    onGranularityChange
  } = props;

  const summary = timeSeriesData?.summary || {
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    api_requests: 0,
    models_called: 0
  };

  const summaryCards = useMemo(() => {
    return [
      {
        label: formatLargeNumber(summary.input_tokens) as string,
        value: 'Input tokens',
        color: baseColorMap.baseR3,
        iconType: 'roundRect'
      },
      {
        label: formatLargeNumber(summary.output_tokens) as string,
        value: 'Output tokens',
        color: baseColorMap.base,
        iconType: 'roundRect'
      },
      {
        label: formatLargeNumber(summary.total_tokens) as string,
        value: 'Total tokens',
        color: baseColorMap.baseL1,
        iconType: 'roundRect'
      },
      {
        label: formatLargeNumber(summary.api_requests) as string,
        value: 'API requests',
        color: baseColorMap.baseR1,
        iconType: 'circle'
      },
      {
        label: summary.models_called.toString(),
        value: 'Models used',
        color: baseColorMap.baseR2,
        iconType: 'roundRect'
      }
    ];
  }, [summary]);

  const { chartData, xAxisData } = useMemo(() => {
    if (!timeSeriesData?.series || timeSeriesData.series.length === 0) {
      return { chartData: { line: [], bar: [] }, xAxisData: [] };
    }

    const series = timeSeriesData.series;
    const xAxis = series[0]?.timeline?.map((item) => item.date) || [];

    const colors = [
      baseColorMap.base,
      baseColorMap.baseR3,
      baseColorMap.baseL1,
      baseColorMap.baseR1,
      baseColorMap.baseR2,
      baseColorMap.baseL2
    ];

    const chartSeries = series.map((item, index) => ({
      name: item.label,
      data: item.timeline.map((t) => ({ time: t.date, value: t.value })),
      color: colors[index % colors.length]
    }));

    // API requests use line chart, tokens use bar chart
    if (metric === 'api_requests') {
      return {
        chartData: { line: chartSeries, bar: [] },
        xAxisData: xAxis
      };
    } else {
      return {
        chartData: { line: [], bar: chartSeries },
        xAxisData: xAxis
      };
    }
  }, [timeSeriesData, metric]);

  const legendData = useMemo(() => {
    if (!timeSeriesData?.series) return [];

    return timeSeriesData.series.map((item) => ({
      name: item.label,
      icon: metric === 'api_requests' ? 'circle' : 'roundRect'
    }));
  }, [timeSeriesData, metric]);

  return (
    <div>
      <CardWrapper style={{ width: '100%', marginTop: 20 }}>
        <ControlsWrapper>
          <div className="group">
            <BaseSelect
              variant="borderless"
              prefix={<ControlLabel>Metric</ControlLabel>}
              options={metricOptions}
              value={metric}
              popupMatchSelectWidth={false}
              onChange={onMetricChange}
              style={{ width: 180 }}
            />

            <BaseSelect
              variant="borderless"
              prefix={<ControlLabel>Group by</ControlLabel>}
              options={groupByOptions}
              value={groupBy}
              popupMatchSelectWidth={false}
              onChange={onGroupByChange}
            />
          </div>
          <Segmented
            size="small"
            options={granularities}
            value={granularity}
            onChange={onGranularityChange}
          ></Segmented>
        </ControlsWrapper>

        {/* <SimpleCard dataList={summaryCards} height={80} /> */}
        <MixLineBar
          chartData={chartData}
          seriesData={[]}
          xAxisData={xAxisData}
          height={280}
          smooth={false}
          legendData={legendData}
          labelFormatter={labelFormatter}
        />
      </CardWrapper>
    </div>
  );
};

export default DailyUsage;
