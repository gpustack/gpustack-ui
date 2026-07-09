import useCoolColors from '@/hooks/use-cool-colors';
import BarChart from '@/pages/_components/bar-chart';
import { BaseSelect, CardWrapper } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Segmented } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { granularities, groupByOptions, metricOptions } from '../config';
import {
  BreakdownItem,
  UsageBreakdownResponse,
  UsageFilterItem
} from '../config/types';
import { withDeletedMark } from '../utils/deleted-label';

// group dimension → the id field inside ``identity.current`` (the backend nulls
// it for deleted entities, so the marker falls back to just "[Deleted]").
const GROUP_ID_KEY: Record<string, 'route_id' | 'user_id' | 'api_key_id'> = {
  route: 'route_id',
  user: 'user_id',
  api_key: 'api_key_id'
};

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

const tooltipNameMap: Record<string, string> = {
  input_cached_tokens: 'usage.filter.inputTokens'
};

interface DailyUsageProps {
  timeSeriesData: UsageBreakdownResponse | null;
  metric: string;
  groupBy: string | null;
  granularity: string;
  startDate: string;
  endDate: string;
  onMetricChange: (value: string) => void;
  onGroupByChange: (value: string | null) => void;
  onGranularityChange: (value: string) => void;
}

const generateDateRange = (
  start: string,
  end: string,
  granularity: string
): string[] => {
  if (!start || !end) return [];
  const unit = granularity as 'day' | 'week' | 'month';
  const dates: string[] = [];
  let cursor = dayjs(start);
  const endDay = dayjs(end);
  while (cursor.isSame(endDay, 'day') || cursor.isBefore(endDay, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, unit);
  }
  return dates;
};

const CACHED_METRIC = 'input_cached_tokens';

const DailyUsage: React.FC<DailyUsageProps> = (props) => {
  const intl = useIntl();
  const {
    timeSeriesData,
    metric,
    groupBy,
    granularity,
    startDate,
    endDate,
    onMetricChange,
    onGroupByChange,
    onGranularityChange
  } = props;
  const generateCoolColors = useCoolColors();
  // ``canSeeOrgAdmin`` widens to Org owners of the selected Org
  // (Personal Org excluded). Mirrors the BE's
  // ``_can_use_all_scope`` gate for the per-user breakdown
  // dimension.
  const access = useAccess();
  const canGroupByUser = !!access.canSeeOrgAdmin;

  const labelFormatter = (v: any) => {
    if (granularity === 'month') {
      return dayjs(v).format('YYYY-MM');
    }
    return dayjs(v).format('MM-DD');
  };

  // Recompute only when data (or locale) changes, NOT when metric/groupBy/granularity change.
  // Filter changes already trigger a refetch; deriving on stale data with new filters
  // produces an inconsistent intermediate frame (e.g. grouped data flattened to total),
  // which is the visible flicker.
  const { seriesData, xAxisData, legendData } = useMemo(() => {
    const items = timeSeriesData?.items || [];
    if (items.length === 0) {
      return {
        seriesData: [],
        xAxisData: [],
        legendData: []
      };
    }

    const groupDim = groupBy as 'user' | 'route' | 'api_key' | null;
    const isCached = metric === CACHED_METRIC;

    const dateSet = new Set<string>(
      generateDateRange(startDate, endDate, granularity)
    );
    items.forEach((item) => {
      if (item.date?.value) {
        dateSet.add(item.date.value);
      }
    });

    const xAxis = Array.from(dateSet).sort(
      (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()
    );

    const deletedWord = intl.formatMessage({ id: 'usage.table.deleted' });

    const groupOrder: string[] = [];
    const groupItemsMap = new Map<string, Map<string, BreakdownItem>>();

    items.forEach((item) => {
      const groupEntity = groupDim
        ? (item[groupDim] as UsageFilterItem)
        : undefined;
      const groupLabel = groupDim
        ? withDeletedMark(
            groupEntity?.label ?? '-',
            groupEntity?.deleted,
            deletedWord,
            groupEntity?.identity?.current?.[GROUP_ID_KEY[groupDim]]
          )
        : '__total__';

      if (!groupItemsMap.has(groupLabel)) {
        groupItemsMap.set(groupLabel, new Map());
        groupOrder.push(groupLabel);
      }

      const dateKey = item.date?.value;
      if (dateKey) {
        groupItemsMap.get(groupLabel)!.set(dateKey, item);
      }
    });

    const metricOption = metricOptions.find((m) => m.value === metric);
    const metricLabel = metricOption?.label
      ? intl.formatMessage({ id: metricOption.label })
      : metric;

    const tooltipNameId = tooltipNameMap[metric];
    const tooltipName = tooltipNameId
      ? intl.formatMessage({ id: tooltipNameId })
      : null;

    const barSeries: any[] = [];
    const groupColors = generateCoolColors(groupOrder.length);

    groupOrder.forEach((groupLabel, groupIdx) => {
      const dateMap = groupItemsMap.get(groupLabel)!;
      const isTotal = groupLabel === '__total__';
      const baseName = isTotal ? metricLabel : groupLabel;
      const groupColor = groupColors[groupIdx];
      const seriesTooltipName = isTotal ? tooltipName : null;

      if (isCached) {
        const uncachedLabel = intl.formatMessage({
          id: 'usage.chart.uncached'
        });
        const cachedLabel = intl.formatMessage({
          id: 'usage.chart.cached'
        });

        const uncachedData = xAxis.map((date) => {
          const item = dateMap.get(date);
          return {
            time: date,
            value: item
              ? (item.input_tokens || 0) - (item.input_cached_tokens || 0)
              : 0,
            stackLabel: uncachedLabel,
            tooltipName: seriesTooltipName
          };
        });
        const cachedData = xAxis.map((date) => {
          const item = dateMap.get(date);
          return {
            time: date,
            value: item ? item.input_cached_tokens || 0 : 0,
            stackLabel: cachedLabel,
            tooltipName: seriesTooltipName
          };
        });

        const seriesName =
          groupLabel === '__total__' ? metricLabel : groupLabel;

        barSeries.push({
          name: seriesName,
          data: uncachedData,
          color: groupColor,
          stack: 'uncached'
        });
        barSeries.push({
          name: seriesName,
          data: cachedData,
          color: groupColor,
          stack: 'cached'
        });
      } else {
        const data = xAxis.map((date) => {
          const item = dateMap.get(date);
          return {
            time: date,
            value: item
              ? (item[metric as keyof BreakdownItem] as number) || 0
              : 0,
            tooltipName: seriesTooltipName
          };
        });

        barSeries.push({
          name: baseName,
          data,
          color: groupColor,
          stack: 'total'
        });
      }
    });

    const seenNames = new Set<string>();
    const dedupedLegend = barSeries
      .filter((s) => {
        if (seenNames.has(s.name)) return false;
        seenNames.add(s.name);
        return true;
      })
      .map((s) => ({
        name: s.name,
        icon: metric === 'api_requests' ? 'circle' : 'roundRect'
      }));

    return {
      seriesData: barSeries,
      xAxisData: xAxis,
      legendData: dedupedLegend
    };
  }, [timeSeriesData, intl, generateCoolColors]);

  const handleOnGroupByChange = (value: string) => {
    onGroupByChange(value || null);
  };

  const groupByOptionsFiltered = groupByOptions
    .map((item) => ({
      label: intl.formatMessage({ id: item.label }),
      value: item.value
    }))
    .filter((option) => {
      if (canGroupByUser) {
        return true;
      }
      return option.value !== 'user';
    });

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
              options={groupByOptionsFiltered}
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
        <BarChart
          seriesData={seriesData}
          xAxisData={xAxisData}
          height={280}
          grid={{
            bottom: 28
          }}
          legendData={legendData}
          labelFormatter={labelFormatter}
          legendIsolate={metric === CACHED_METRIC}
        />
      </CardWrapper>
    </div>
  );
};

export default DailyUsage;
