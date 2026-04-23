import { baseColorMap } from '@/pages/dashboard/config';
import { BaseSelect, CardWrapper, MixLineBarChart } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
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

function getColorForIndex(index: number) {
  const hue = (index * 137.5) % 360;
  return `oklch(70% 0.12 ${hue})`;
}

const colors = [
  baseColorMap.base,
  baseColorMap.baseR3,
  baseColorMap.baseL1,
  baseColorMap.baseR1,
  baseColorMap.baseR2,
  baseColorMap.baseL2
];

interface DailyUsageProps {
  timeSeriesData: TimeSeriesData | null;
  metric: string;
  groupBy: string | null;
  granularity: string;
  onMetricChange: (value: string) => void;
  onGroupByChange: (value: string | null) => void;
  onGranularityChange: (value: string) => void;
}

const labelFormatter = (v: any) => {
  return dayjs(v).format('MM-DD');
};

const DailyUsage: React.FC<DailyUsageProps> = (props) => {
  const intl = useIntl();
  const {
    timeSeriesData,
    metric,
    groupBy,
    granularity,
    onMetricChange,
    onGroupByChange,
    onGranularityChange
  } = props;

  const { chartData, xAxisData } = useMemo(() => {
    if (!timeSeriesData?.series || timeSeriesData.series.length === 0) {
      return { chartData: { line: [], bar: [] }, xAxisData: [] };
    }

    const series = timeSeriesData.series;
    const dateSet = new Set<string>();

    for (const item of series) {
      for (const point of item.timeline) {
        dateSet.add(point.date);
      }
    }

    // sort dates in ascending order
    const xAxis = Array.from(dateSet).sort(
      (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()
    );

    const chartSeries = series.map((item, index) => {
      const timelineMap = new Map(
        item.timeline.map((point) => [
          point.date,
          { time: point.date, value: point.value }
        ])
      );

      return {
        name: item.label,
        data: xAxis.map((date) => timelineMap.get(date) ?? null),
        color: colors[index % colors.length]
      };
    });

    // API requests use line chart, tokens use bar chart
    return {
      chartData: { line: [], bar: chartSeries },
      xAxisData: xAxis
    };
  }, [timeSeriesData, metric]);

  const legendData = useMemo(() => {
    if (!timeSeriesData?.series) return [];

    return timeSeriesData.series.map((item) => ({
      name: item.label,
      icon: metric === 'api_requests' ? 'circle' : 'roundRect'
    }));
  }, [timeSeriesData, metric]);

  const handleOnGroupByChange = (value: string) => {
    onGroupByChange(value || null);
  };

  return (
    <div>
      <CardWrapper style={{ width: '100%', marginTop: 20 }}>
        <ControlsWrapper>
          <div className="group">
            <BaseSelect
              variant="borderless"
              prefix={
                <ControlLabel>
                  {intl.formatMessage({ id: 'usage.filter.metric' })}
                </ControlLabel>
              }
              options={metricOptions.map((item) => ({
                label: intl.formatMessage({ id: item.label }),
                value: item.value
              }))}
              value={metric}
              popupMatchSelectWidth={false}
              onChange={onMetricChange}
              style={{ width: 'max-content' }}
            />

            <BaseSelect
              allowClear
              variant="borderless"
              prefix={
                <ControlLabel>
                  {intl.formatMessage({ id: 'usage.filter.groupBy' })}
                </ControlLabel>
              }
              options={groupByOptions.map((item) => ({
                label: intl.formatMessage({ id: item.label }),
                value: item.value
              }))}
              value={groupBy}
              popupMatchSelectWidth={false}
              onChange={handleOnGroupByChange}
              style={{ width: 'max-content' }}
            />
          </div>
          <Segmented
            size="small"
            options={granularities.map((item) => ({
              label: intl.formatMessage({ id: item.label }),
              value: item.value
            }))}
            value={granularity}
            onChange={onGranularityChange}
          ></Segmented>
        </ControlsWrapper>
        <MixLineBarChart
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
