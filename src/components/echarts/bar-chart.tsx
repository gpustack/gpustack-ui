import Chart from '@/components/echarts/chart';
import {
  barItemConfig,
  grid,
  legend,
  title as titleConfig,
  tooltip,
  xAxis,
  yAxis
} from '@/components/echarts/config';
import _ from 'lodash';
import { memo, useEffect, useState } from 'react';
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
  const [dataOptions, setDataOptions] = useState({});

  const options = {
    title: {
      text: ''
    },
    grid,
    tooltip: {
      ...tooltip
      // axisPointer: {
      //   type: 'shadow'
      // }
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

  useEffect(() => {
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
    const optionsConfig = {
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
    console.log('optionsConfig=========', optionsConfig);
    setDataOptions(optionsConfig);
  }, [seriesData, xAxisData, title]);
  return (
    <Chart
      height={height}
      options={dataOptions}
      width={width || '100%'}
    ></Chart>
  );
};

export default memo(BarChart);
