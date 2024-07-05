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
import EmptyData from '@/components/empty-data';
import _ from 'lodash';
import { memo } from 'react';
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

  if (!seriesData.length) {
    return <EmptyData height={height} title={title}></EmptyData>;
  }

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
  const setDataOptions = () => {
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
  };

  const dataOptions: any = setDataOptions();

  return (
    <Chart
      height={height}
      options={dataOptions}
      width={width || '100%'}
    ></Chart>
  );
};

export default memo(BarChart);
