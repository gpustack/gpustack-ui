import Chart from '@/components/echarts/chart';
import {
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
    title: titleConfig,
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

  const setDataOptions = () => {
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
        left: 'start',
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
