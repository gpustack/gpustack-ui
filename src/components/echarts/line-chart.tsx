import Chart from '@/components/echarts/chart';
import {
  grid,
  legend,
  lineItemConfig,
  title as titleConfig,
  tooltip,
  xAxis,
  yAxis
} from '@/components/echarts/config';
import _ from 'lodash';
import { memo } from 'react';
import { ChartProps } from './types';

const LineChart: React.FC<ChartProps> = (props) => {
  const {
    seriesData,
    xAxisData,
    height,
    width,
    labelFormatter,
    legendData,
    smooth,
    title
  } = props;

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
      }
    },
    yAxis,
    legend: {
      ...legend,
      data: []
    },

    series: []
  };

  const generateOptions = (): any => {
    const data = _.map(seriesData, (item: any) => {
      return {
        ...item,
        ...lineItemConfig,
        smooth: smooth,
        itemStyle: {
          ...lineItemConfig.itemStyle,
          color: item.color
        },
        lineStyle: {
          ...lineItemConfig.lineStyle,
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
    return optionsConfig;
  };
  const dataOptions = generateOptions();
  return (
    <Chart
      height={height}
      options={dataOptions}
      width={width || '100%'}
    ></Chart>
  );
};

export default memo(LineChart);
