/**
 * Metric + granularity chart card for the resource-usage tabs.
 *
 * Mirrors ``DailyUsage`` (the Token tab's chart) so the Resource / GPU
 * Instances / Storage tabs share the exact same look — ``CardWrapper`` +
 * borderless ``BaseSelect`` with a prefix label + small ``Segmented`` for
 * Day/Week/Month — instead of inventing a new style. Decoupled from the
 * token data shape: callers pass ready-made bar series.
 */
import BarChart, { BarSeriesItem } from '@/pages/_components/bar-chart';
import { BaseSelect, CardWrapper } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Segmented } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import { granularities } from '../config';

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

interface MetricOption {
  value: string;
  label: string;
}

interface MetricChartCardProps {
  metric: string;
  metricOptions: MetricOption[];
  granularity: string;
  onMetricChange: (value: string) => void;
  onGranularityChange: (value: string) => void;
  seriesData: BarSeriesItem[];
  xAxisData: string[];
}

const MetricChartCard: React.FC<MetricChartCardProps> = ({
  metric,
  metricOptions,
  granularity,
  onMetricChange,
  onGranularityChange,
  seriesData,
  xAxisData
}) => {
  const intl = useIntl();

  const labelFormatter = (v: any) =>
    granularity === 'hour'
      ? dayjs(v).format('MM-DD HH:00')
      : granularity === 'month'
        ? dayjs(v).format('YYYY-MM')
        : dayjs(v).format('MM-DD');

  return (
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
            options={metricOptions}
            value={metric}
            popupMatchSelectWidth={false}
            onChange={onMetricChange}
            style={{ width: 'max-content' }}
          />
        </div>
        <Segmented
          size="small"
          options={[
            {
              label: intl.formatMessage({
                id: 'usage.filter.granularity.hour',
                defaultMessage: 'Hour'
              }),
              value: 'hour'
            },
            ...granularities.map((item) => ({
              label: intl.formatMessage({ id: item.label }),
              value: item.value
            }))
          ]}
          value={granularity}
          onChange={onGranularityChange}
        />
      </ControlsWrapper>
      <BarChart
        seriesData={seriesData}
        xAxisData={xAxisData}
        height={280}
        labelFormatter={labelFormatter}
      />
    </CardWrapper>
  );
};

export default MetricChartCard;
