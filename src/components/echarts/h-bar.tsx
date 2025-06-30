import Chart from '@/components/echarts/chart';
import useChartConfig from '@/components/echarts/config';
import EmptyData from '@/components/empty-data';
import _ from 'lodash';
import React, { memo, useMemo } from 'react';
import { ChartProps } from './types';

const BarChart: React.FC<ChartProps & { maxItems?: number }> = (props) => {
  const {
    seriesData,
    xAxisData,
    height,
    width,
    labelFormatter,
    legendData,
    maxItems,
    title
  } = props;
  const {
    grid,
    legend,
    title: titleConfig,
    tooltip,
    xAxis,
    yAxis
  } = useChartConfig();

  const dataOptions = useMemo((): any => {
    const options = {
      title: {
        ...titleConfig,
        left: 'start'
      },
      grid: {
        ...grid,
        top: 0,
        bottom: maxItems
          ? `${(1 / maxItems) * (maxItems - xAxisData.length) * 100}%`
          : 0
      },
      tooltip: {
        ...tooltip
      },
      xAxis: {
        ...xAxis,
        axisLabel: {
          ...xAxis.axisLabel,
          formatter: labelFormatter
        }
      },
      yAxis: {
        ...yAxis,
        axisLabel: {
          ...yAxis.axisLabel,
          overflow: 'truncate',
          width: 75,
          ellipsis: '...'
        }
      },
      legend: {
        ...legend,
        data: []
      },

      series: []
    };
    const data = _.map(seriesData, (item: any) => {
      return {
        ...item,
        type: 'bar',
        barWidth: 20,
        stack: 'Ad',
        barGap: '30%',
        label: {
          show: false
        },
        itemStyle: {
          color: item.color
        }
      };
    });
    return {
      ...options,
      animation: false,
      title: {
        ...options.title,
        text: title
      },
      yAxis: {
        ...options.yAxis,
        inverse: true,
        type: 'category',

        splitLine: {
          show: false
        },
        data: xAxisData,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        }
      },
      xAxis: {
        ...options.xAxis,
        type: 'value',
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        axisTick: {
          show: false
        }
      },
      series: data
    };
  }, [
    seriesData,
    xAxisData,
    title,
    labelFormatter,
    tooltip,
    grid,
    xAxis,
    yAxis,
    legend
  ]);

  return (
    <>
      {!seriesData.length ? (
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

export default memo(BarChart);
