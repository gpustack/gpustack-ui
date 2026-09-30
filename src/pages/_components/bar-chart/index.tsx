import useCoolColors from '@/hooks/use-cool-colors';
import { Chart } from '@gpustack/core-ui/charts';
import { formatLargeNumber } from '@gpustack/core-ui/utils';
import { Empty, Spin, theme } from 'antd';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

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
  loading?: boolean;
  legendData?: { name: string; icon?: string }[];
  labelFormatter?: (val: any, index?: number) => string;
  tooltipValueFormatter?: (val: any) => string;
  title?: string;
  grid?: {
    left?: number | string;
    right?: number | string;
    top?: number | string;
    bottom?: number | string;
    containLabel?: boolean;
  };
  legendIsolate?: boolean;
  hideZeroValuesInTooltip?: boolean;
  scrollableTooltip?: boolean;
  tooltipMaxItems?: number;
  tooltipTotalLabel?: string;
  tooltipOverflowFormatter?: (count: number, value: number) => string;
  onBarClick?: (xAxisValue: string) => void;
}

const positionScrollableTooltip = (
  point: number[],
  _params: unknown,
  dom: HTMLElement,
  _rect: unknown,
  { contentSize }: { contentSize: [number, number] }
): [number, number] => {
  const chartRect = dom.parentElement?.getBoundingClientRect();
  if (!chartRect) return [point[0], point[1]];

  const [width, height] = contentSize;
  const gap = 12;
  const minX = gap - chartRect.left;
  const maxX = window.innerWidth - gap - chartRect.left - width;
  const minY = gap - chartRect.top;
  const maxY = window.innerHeight - gap - chartRect.top - height;
  const preferredX =
    point[0] + width + gap > window.innerWidth - chartRect.left - gap
      ? point[0] - width - gap
      : point[0] + gap;
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, max));

  return [
    clamp(preferredX, minX, maxX),
    clamp(point[1] - height / 2, minY, maxY)
  ];
};

const BarChart: React.FC<BarChartProps> = (props) => {
  const {
    seriesData,
    xAxisData,
    height,
    width,
    legendData,
    loading,
    labelFormatter,
    tooltipValueFormatter,
    title,
    grid,
    legendIsolate,
    hideZeroValuesInTooltip,
    scrollableTooltip,
    tooltipMaxItems,
    tooltipTotalLabel,
    tooltipOverflowFormatter,
    onBarClick
  } = props;
  const { token } = theme.useToken();
  const chartRef = useRef<{ chart: any } | null>(null);
  const generateCoolColors = useCoolColors();

  // ECharts reads the DOM width at init time; with a "100%" width it can pick
  // up a stale/tiny value while the flex child's layout is still resolving,
  // rendering every bar squeezed at the left edge until its internal (throttled)
  // ResizeObserver corrects it ~100ms later — a visible blue-sliver flash. We
  // measure the container ourselves via a callback ref (which fires during
  // commit, before paint) and feed ECharts an explicit pixel width, so the very
  // first render is already correct. No gating, so the chart mounts with no
  // extra delay; the ResizeObserver keeps the width in sync afterwards.
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    if (!node) return;
    setMeasuredWidth(node.clientWidth);
    resizeObserverRef.current = new ResizeObserver(() => {
      setMeasuredWidth(node.clientWidth);
    });
    resizeObserverRef.current.observe(node);
  }, []);
  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  const dynamicColors = useMemo(
    () => generateCoolColors(seriesData.length),
    [seriesData.length, generateCoolColors]
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
        // Keep a small floor only — a large barMinWidth would force wide bars
        // when there are many categories (e.g. hourly buckets), squeezing out
        // the category gap so bars look fused. A low floor lets barCategoryGap
        // win, so even dense hourly views keep visible gaps.
        barMinWidth: 2,
        barGap: '30%',
        barCategoryGap: '50%',
        cursor: onBarClick ? 'pointer' : 'default',
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
        bottom: 8,
        containLabel: true,
        ...grid
      },
      tooltip: {
        trigger: 'axis',
        enterable: scrollableTooltip,
        hideDelay: scrollableTooltip ? 200 : undefined,
        position: scrollableTooltip ? positionScrollableTooltip : undefined,
        className: scrollableTooltip
          ? 'bar-chart-scrollable-tooltip'
          : undefined,
        backgroundColor: token.colorBgElevated,
        borderColor: 'transparent',
        formatter: (params: any) => {
          let result = `<span class="tooltip-x-name">${params[0].axisValue}</span>`;
          const items = params.flatMap((item: any) => {
            const raw = item.data?.value ?? item.value;
            if (hideZeroValuesInTooltip && raw === 0) return [];
            const value = tooltipValueFormatter
              ? tooltipValueFormatter(raw)
              : raw;
            if (value === null || value === undefined) return [];
            return [{ item, raw, value }];
          });
          if (tooltipMaxItems) {
            items.sort((a: any, b: any) => Number(b.raw) - Number(a.raw));
          }
          const visibleItems = tooltipMaxItems
            ? items.slice(0, tooltipMaxItems)
            : items;
          const hiddenItems = tooltipMaxItems
            ? items.slice(tooltipMaxItems)
            : [];

          if (tooltipTotalLabel) {
            const total = items.reduce(
              (sum: number, { raw }: any) => sum + Number(raw),
              0
            );
            result += `<span class="tooltip-total">
              <span>${tooltipTotalLabel}</span>
              <strong>${total.toLocaleString()}</strong>
            </span>`;
          }

          visibleItems.forEach(({ item, value }: any) => {
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

          if (hiddenItems.length && tooltipOverflowFormatter) {
            const hiddenValue = hiddenItems.reduce(
              (sum: number, { raw }: any) => sum + Number(raw),
              0
            );
            result += `<span class="tooltip-overflow">${tooltipOverflowFormatter(hiddenItems.length, hiddenValue)}</span>`;
          }

          const wrapperClassName =
            visibleItems.length >= 12
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
    hideZeroValuesInTooltip,
    scrollableTooltip,
    tooltipMaxItems,
    tooltipTotalLabel,
    tooltipOverflowFormatter,
    onBarClick,
    legendData,
    title,
    token
  ]);

  useEffect(() => {
    if (!onBarClick) return;
    const chart = chartRef.current?.chart;
    if (!chart) return;

    const handler = (params: any) => {
      if (params.componentType !== 'series') return;
      const date = xAxisData[params.dataIndex];
      if (date) onBarClick(date);
    };

    chart.on('click', handler);
    return () => chart.off('click', handler);
  }, [onBarClick, seriesData, xAxisData]);

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
    return (
      <div
        style={{
          width: width || '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {loading ? (
          <Spin size="middle" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    );
  }

  return (
    <div
      ref={measureRef}
      style={{ width: width || '100%', height, position: 'relative' }}
    >
      <Chart
        ref={chartRef as any}
        options={options as any}
        height={height}
        width={measuredWidth || width || '100%'}
      />
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--ant-color-bg-container)',
            opacity: 0.6,
            pointerEvents: 'none'
          }}
        >
          <Spin size="middle" />
        </div>
      )}
    </div>
  );
};

export default BarChart;
