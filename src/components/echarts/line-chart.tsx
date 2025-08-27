import Chart from '@/components/echarts/chart';
import useChartConfig from '@/components/echarts/config';
import EmptyData from '@/components/empty-data';
import _ from 'lodash';
import React, { memo, useMemo } from 'react';
import { ChartProps } from './types';

const LineChart: React.FC<ChartProps> = (props) => {
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
    legendOptions,
    gridOptions,
    titleOptions
  } = props;
  const {
    grid,
    legend,
    lineItemConfig,
    title: titleConfig,
    tooltip,
    xAxis,
    yAxis
  } = useChartConfig();

  const axisLabelFormatter = (value: string, index: number) => {
    if (labelFormatter) {
      return labelFormatter(value, index);
    }
    if (index === xAxisData.length - 1) {
      return '';
    }
    return value;
  };

  const options = {
    title: {
      text: ''
    },
    grid: {
      ...grid,
      ...gridOptions
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
        formatter: axisLabelFormatter
      }
    },
    yAxis,
    legend: {
      ...legend,
      ...legendOptions,
      data: legendData.map((item: any) => {
        return {
          name: item,
          icon: 'circle'
        };
      })
    },

    series: []
  };

  const dataOptions = useMemo((): any => {
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
    return {
      ...options,
      animation: false,
      title: {
        ...titleConfig,
        ...titleOptions,
        text: title
      },
      yAxis: {
        ...options.yAxis,
        name: yAxisName,
        nameTextStyle: {
          fontSize: 12,
          align: 'right'
        }
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
    yAxisName,
    title,
    smooth,
    titleOptions,
    legendData,
    options
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

export default memo(LineChart);
