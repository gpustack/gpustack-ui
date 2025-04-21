import Chart from '@/components/echarts/chart';
import useChartConfig from '@/components/echarts/config';
import EmptyData from '@/components/empty-data';
import _ from 'lodash';
import React, { memo, useMemo } from 'react';
import { ChartProps } from './types';

const BarChart: React.FC<ChartProps> = (props) => {
  const {
    seriesData,
    xAxisData,
    height,
    width,
    labelFormatter,
    legendData,
    title
  } = props;
  const {
    barItemConfig,
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
        text: ''
      },
      grid,
      tooltip: {
        ...tooltip
      },
      xAxis: {
        ...xAxis,
        axisLabel: {
          ...xAxis.axisLabel,
          formatter: labelFormatter
        },
        data: []
      },
      yAxis,
      legend: {
        ...legend,
        data: []
      },

      series: []
    };
    const data = _.map(seriesData, (item: any) => {
      return {
        ...item,
        ...barItemConfig,
        stack: 'total',
        itemStyle: {
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
      yAxis: {
        ...options.yAxis
      },
      xAxis: {
        ...options.xAxis,
        data: xAxisData
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
    legend,
    barItemConfig
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
