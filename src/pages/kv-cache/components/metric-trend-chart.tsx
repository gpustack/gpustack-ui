import { LineChart } from '@gpustack/core-ui/charts';
import { useIntl } from '@umijs/max';
import { Empty } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';
import { MetricPoint } from '../config/types';

export interface MetricSeries {
  name: string;
  color?: string;
  data: MetricPoint[];
}

interface MetricTrendChartProps {
  title: string;
  series: MetricSeries[];
  // pins the axis ceiling (e.g. 100 for ratio charts); units live in
  // the title, where they render unclipped
  yAxisMax?: number;
  // formats tooltip values, e.g. append "%" or a unit
  valueFormatter?: (value: any) => string;
  height?: number;
}

const titleOptions = {
  left: 0
};

const MetricTrendChart: React.FC<MetricTrendChartProps> = ({
  title,
  series,
  yAxisMax,
  valueFormatter,
  height = 320
}) => {
  const intl = useIntl();

  const generateData = useMemo(() => {
    const legendData: string[] = [];
    // Every series aligns to the union of timestamps by position (the
    // category axis matches by index, not by name), so a series that
    // starts mid-window pads with nulls instead of shifting left. The
    // category key carries the date: a 24h window holds the same
    // HH:mm:ss twice, and a bare-time key would collapse the two
    // categories. Timestamps are epoch seconds.
    const timestamps = Array.from(
      new Set(series.flatMap((item) => item.data.map((p) => p.timestamp)))
    ).sort((a, b) => a - b);
    const xAxisData = timestamps.map((timestamp) =>
      dayjs(timestamp * 1000).format('MM-DD HH:mm:ss')
    );
    const seriesData = series.map((item: MetricSeries) => {
      legendData.push(item.name);
      const valueByTime = new Map(
        item.data.map((point) => [point.timestamp, point.value])
      );
      const values = timestamps.map((timestamp) =>
        valueByTime.has(timestamp) ? valueByTime.get(timestamp)! : null
      );
      // a value both of whose neighbors are gaps is unreachable by any
      // line segment: it gets a symbol so it renders at all (the
      // series opts into symbol rendering only when one exists)
      let hasIsolated = false;
      const data = values.map((value, index) => {
        const isolated =
          value != null &&
          (index === 0 || values[index - 1] == null) &&
          (index === values.length - 1 || values[index + 1] == null);
        hasIsolated = hasIsolated || isolated;
        return {
          time: xAxisData[index],
          value,
          symbol: isolated ? 'circle' : 'none',
          symbolSize: isolated ? 6 : 0
        };
      });
      return {
        name: item.name,
        color: item.color,
        // typed loosely: core-ui honors it from the showSymbol change
        // on; a no-op on older builds until the dependency bumps
        showSymbol: hasIsolated || undefined,
        data
      };
    });
    return {
      seriesData,
      legendData,
      xAxisData
    };
  }, [series]);

  // axis labels show the time only (the date lives in the category key
  // and the tooltip); the last label stays hidden like the default
  const axisLabelFormatter = (value: string, index: number) =>
    index === generateData.xAxisData.length - 1 ? '' : value.slice(6);

  const isEmpty = _.every(series, (item: MetricSeries) => !item.data?.length);

  if (isEmpty) {
    return (
      <div style={{ height }} className="flex-column">
        <h3
          className="font-size-14"
          style={{ marginBottom: 0, fontWeight: 600 }}
        >
          {title}
        </h3>
        <div className="flex-center justify-center" style={{ flex: 1 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={intl.formatMessage({ id: 'kvCache.detail.noMetrics' })}
          />
        </div>
      </div>
    );
  }

  return (
    <LineChart
      height={height}
      title={title}
      showArea={false}
      seriesData={generateData.seriesData}
      legendData={generateData.legendData}
      xAxisData={generateData.xAxisData}
      labelFormatter={axisLabelFormatter}
      tooltipValueFormatter={valueFormatter}
      smooth={true}
      width="100%"
      // typed in core-ui's ChartProps from the line-chart-yaxis-max
      // change on; a no-op on older builds until the dependency bumps
      {...({ yAxisMax } as any)}
      titleOptions={titleOptions}
    ></LineChart>
  );
};

export default MetricTrendChart;
