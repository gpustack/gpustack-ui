import Chart from '@/components/echarts/chart';
import useChartConfig from '@/components/echarts/config';
import EmptyData from '@/components/empty-data';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { ChartProps } from './types';

const MixLineBarChart: React.FC<
  ChartProps & {
    chartData: {
      line: any[];
      bar: any[];
    };
  }
> = (props) => {
  const {
    seriesData,
    xAxisData,
    yAxisName,
    height,
    width,
    labelFormatter,
    tooltipValueFormatter = null,
    legendData = [],
    smooth,
    title,
    chartData
  } = props;
  const {
    grid,
    legend,
    lineItemConfig,
    barItemConfig,
    title: titleConfig,
    tooltip,
    xAxis,
    yAxis
  } = useChartConfig();

  const { line: lineSeriesData, bar: barSeriesData } = chartData;

  const options = {
    title: {
      text: ''
    },
    grid: {
      ...grid,
      right: 0,
      top: 20,
      bottom: 10
    },
    tooltip: {
      ...tooltip,
      formatter(params: any) {
        return tooltipValueFormatter
          ? tooltip.formatter(params, tooltipValueFormatter)
          : tooltip.formatter(params);
      }
    },
    xAxis: {
      ...xAxis,
      axisLabel: {
        ...xAxis.axisLabel,
        formatter: labelFormatter
      }
    },
    yAxis,
    legend: {
      ...legend,
      data: legendData,
      itemGap: 20,
      bottom: 5,
      show: false
    },

    series: []
  };

  const dataOptions = useMemo((): any => {
    const linedata = _.map(lineSeriesData, (item: any) => {
      return {
        ...item,
        ...lineItemConfig,
        smooth: smooth,
        itemStyle: {
          ...lineItemConfig.itemStyle,
          color: item.color
        },
        yAxisIndex: 1,
        lineStyle: {
          ...lineItemConfig.lineStyle,
          color: item.color
        }
      };
    });

    const barData = _.map(barSeriesData, (item: any) => {
      return {
        ...item,
        ...barItemConfig,
        stack: 'total',
        yAxisIndex: 0,
        itemStyle: {
          ...item.itemStyle,
          color: item.color
        }
      };
    });

    return {
      ...options,
      animation: false,
      title: {
        ...titleConfig,
        text: title
      },
      yAxis: [
        {
          ...options.yAxis
        },
        {
          ...options.yAxis,
          nameTextStyle: {
            fontSize: 12,
            align: 'right'
          }
        }
      ],
      xAxis: {
        ...options.xAxis,
        data: xAxisData
      },
      series: [...barData, ...linedata]
    };
  }, [seriesData, xAxisData, yAxisName, title, smooth, legendData, options]);

  return (
    <>
      {!lineSeriesData.length && !barSeriesData.length ? (
        <EmptyData height={height} title={title}></EmptyData>
      ) : (
        <Chart
          height={height}
          options={dataOptions}
          width={width || '100%'}
        ></Chart>
      )}
    </>
  );
};

export default MixLineBarChart;
