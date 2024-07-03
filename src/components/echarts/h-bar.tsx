import Chart from '@/components/echarts/chart';
import {
  grid,
  legend,
  title as titleConfig,
  tooltip,
  xAxis,
  yAxis
} from '@/components/echarts/config';
import _ from 'lodash';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
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
      return item;
    });
    const optionsConfig = {
      ...options,
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
        boundaryGap: true,
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
    console.log('optionsConfig========h=', optionsConfig);
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

export default BarChart;