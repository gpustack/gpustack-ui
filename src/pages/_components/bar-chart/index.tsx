import { Chart } from '@gpustack/core-ui';
import { formatLargeNumber } from '@gpustack/core-ui/utils';
import { theme } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';

const COOL_HUE_START = 180;
const COOL_HUE_END = 280;
const COOL_HUE_RANGE = COOL_HUE_END - COOL_HUE_START;
// golden angle (137.508) mod COOL_HUE_RANGE — coprime offset for even spread
const HUE_STEP = 37.508;

export function generateCoolColors(count: number): string[] {
  if (count <= 0) return [];
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = COOL_HUE_START + ((i * HUE_STEP) % COOL_HUE_RANGE);
    const saturation = 55 + (i % 3) * 5;
    const lightness = 60 + (i % 2) * 6;
    colors.push(`hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
}

export interface BarSeriesItem {
  name: string;
  data: any[];
  color?: string;
  stack?: string | false;
}

export interface BarChartProps {
  seriesData: BarSeriesItem[];
  xAxisData: string[];
  height: number | string;
  width?: number | string;
  legendData?: { name: string; icon?: string }[];
  labelFormatter?: (val: any, index?: number) => string;
  tooltipValueFormatter?: (val: any) => string;
  title?: string;
  legendIsolate?: boolean;
}

const BarChart: React.FC<BarChartProps> = (props) => {
  const {
    seriesData,
    xAxisData,
    height,
    width,
    legendData,
    labelFormatter,
    tooltipValueFormatter,
    title,
    legendIsolate
  } = props;
  const { token } = theme.useToken();
  const chartRef = useRef<{ chart: any } | null>(null);

  const dynamicColors = useMemo(
    () => generateCoolColors(seriesData.length),
    [seriesData.length]
  );

  const options = useMemo(() => {
    // Group series by stack name to compute top-of-stack per date
    const stackGroups = new Map<string, BarSeriesItem[]>();
    seriesData.forEach((s) => {
      if (s.stack === false || !s.stack) return;
      const list = stackGroups.get(s.stack) ?? [];
      list.push(s);
      stackGroups.set(s.stack, list);
    });

    // topMap[`${stack}::${dateIdx}`] = index within stackGroups list of the
    // topmost visible (value > 0) series at that date
    const topMap = new Map<string, number>();
    stackGroups.forEach((stackSeries, stackKey) => {
      const dateCount = Math.max(...stackSeries.map((s) => s.data.length), 0);
      for (let dateIdx = 0; dateIdx < dateCount; dateIdx++) {
        for (let i = stackSeries.length - 1; i >= 0; i--) {
          const dp: any = stackSeries[i].data[dateIdx];
          const value = dp && typeof dp === 'object' ? dp.value : dp;
          if ((value ?? 0) > 0) {
            topMap.set(`${stackKey}::${dateIdx}`, i);
            break;
          }
        }
      }
    });

    const series = _.map(seriesData, (item: BarSeriesItem, index: number) => {
      const { stack, color, data, ...rest } = item;
      const resolvedColor = color || dynamicColors[index];
      const stackKey = stack === false || !stack ? null : (stack as string);
      const stackList = stackKey ? stackGroups.get(stackKey) : null;
      const indexInStack = stackList ? stackList.indexOf(item) : -1;

      const processedData =
        stackKey && stackList
          ? data.map((dp: any, dateIdx: number) => {
              if (dp == null) return dp;
              const isTop =
                topMap.get(`${stackKey}::${dateIdx}`) === indexInStack;
              const base = typeof dp === 'object' ? dp : { value: dp };
              return {
                ...base,
                itemStyle: {
                  borderRadius: isTop ? [2, 2, 0, 0] : 0
                }
              };
            })
          : data;

      return {
        ...rest,
        data: processedData,
        type: 'bar',
        barMaxWidth: 20,
        barMinWidth: 8,
        barGap: '30%',
        barCategoryGap: '50%',
        ...(stack === false || stack === undefined ? {} : { stack }),
        itemStyle: {
          color: resolvedColor,
          borderRadius: [2, 2, 0, 0]
        }
      };
    });

    return {
      title: {
        show: true,
        left: 'center',
        textStyle: { fontSize: 12, color: token.colorText },
        text: title || ''
      },
      grid: {
        left: 0,
        right: 0,
        top: title ? 30 : 10,
        bottom: 28,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: token.colorBgElevated,
        borderColor: 'transparent',
        formatter: (params: any) => {
          let result = `<span class="tooltip-x-name">${params[0].axisValue}</span>`;
          let visibleItemCount = 0;

          params.forEach((item: any) => {
            const raw = item.data?.value ?? item.value;
            const value = tooltipValueFormatter
              ? tooltipValueFormatter(raw)
              : raw;

            if (value === null || value === undefined) return;

            visibleItemCount += 1;
            const stackLabel = item.data?.stackLabel;
            const baseName = item.data?.tooltipName ?? item.seriesName;
            const displayName = stackLabel
              ? `${baseName} (${stackLabel})`
              : baseName;
            result += `<span class="tooltip-item">
              <span class="tooltip-item-name">
                <span class="tooltip-item-dot" style="border-radius:2px;background-color:${item.color};"></span>
                <span class="tooltip-item-title">${displayName}</span>:
              </span>
              <span class="tooltip-value">${value}</span>
            </span>`;
          });

          const wrapperClassName =
            visibleItemCount >= 12
              ? 'tooltip-wrapper tooltip-grid'
              : 'tooltip-wrapper';
          return `<div class="${wrapperClassName}">${result}</div>`;
        }
      },
      legend: {
        type: 'scroll',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 12,
        textStyle: { color: token.colorTextTertiary },
        pageTextStyle: { color: token.colorTextTertiary },
        pageIconColor: token.colorTextTertiary,
        pageIconInactiveColor: token.colorTextDisabled,
        bottom: 0,
        data: legendData,
        show: !!legendData?.length
      },
      xAxis: {
        type: 'category',
        axisTick: {
          show: true,
          lineStyle: { color: token.colorSplit }
        },
        axisLabel: {
          color: token.colorTextTertiary,
          fontSize: 12,
          formatter: labelFormatter
        },
        axisLine: { show: false },
        data: xAxisData
      },
      yAxis: {
        type: 'value',
        nameTextStyle: { padding: [0, 0, 0, -20] },
        splitLine: {
          show: true,
          lineStyle: { type: 'dashed', color: token.colorBorder }
        },
        axisLabel: {
          color: token.colorTextTertiary,
          fontSize: 12,
          formatter: formatLargeNumber
        },
        axisTick: { show: false }
      },
      animation: false,
      series
    };
  }, [
    seriesData,
    xAxisData,
    dynamicColors,
    labelFormatter,
    tooltipValueFormatter,
    legendData,
    title,
    token
  ]);

  useEffect(() => {
    if (!legendIsolate) return;
    const chart = chartRef.current?.chart;
    if (!chart) return;

    const handler = (params: any) => {
      const clicked = params.name;
      const allNames = Object.keys(params.selected || {});
      if (!allNames.length) return;

      const isClickedSelected = !!params.selected[clicked];
      const allOthersHidden = allNames
        .filter((n) => n !== clicked)
        .every((n) => !params.selected[n]);

      let newSelected: Record<string, boolean>;
      if (!isClickedSelected && allOthersHidden) {
        // clicking the only-visible one → restore all
        newSelected = Object.fromEntries(allNames.map((n) => [n, true]));
      } else {
        // isolate clicked
        newSelected = Object.fromEntries(
          allNames.map((n) => [n, n === clicked])
        );
      }

      chart.setOption({ legend: { selected: newSelected } });
    };

    chart.on('legendselectchanged', handler);
    return () => {
      chart.off('legendselectchanged', handler);
    };
  }, [legendIsolate, seriesData, legendData]);

  if (!seriesData.length) {
    return <div style={{ width: width || '100%', height }} />;
  }

  return (
    <Chart
      ref={chartRef as any}
      options={options as any}
      height={height}
      width={width || '100%'}
    />
  );
};

export default BarChart;
