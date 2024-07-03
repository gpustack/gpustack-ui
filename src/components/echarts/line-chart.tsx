import Chart from '@/components/echarts/chart';
import {
  grid,
  legend,
  lineItemConfig,
  tooltip,
  xAxis,
  yAxis
} from '@/components/echarts/config';
import _ from 'lodash';
import { useEffect, useState } from 'react';
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
  const [dataOptions, setDataOptions] = useState({});

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

  useEffect(() => {
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
      title: {
        show: true,
        left: 'center',
        textStyle: {
          fontSize: 14
        },
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
    console.log('optionsConfig========line=', optionsConfig);
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

export default LineChart;
