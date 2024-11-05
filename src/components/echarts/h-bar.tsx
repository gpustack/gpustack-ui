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
import { memo, useMemo } from 'react';
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

  const options = {
    title: {
      ...titleConfig,
      left: 'start'
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

  const dataOptions = useMemo((): any => {
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
  }, [seriesData, xAxisData, title]);

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
