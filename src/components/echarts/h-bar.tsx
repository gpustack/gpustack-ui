import Chart from '@/components/echarts/chart';
import useChartConfig from '@/components/echarts/config';
import EmptyData from '@/components/empty-data';
import _ from 'lodash';
import React, { useMemo } from 'react';
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
    token,
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
          ...xAxis.axisLabel
        }
      },
      yAxis: {
        ...yAxis,
        axisLabel: {
          ...yAxis.axisLabel,
          show: true,
          overflow: 'truncate',
          width: 75,
          ellipsis: '...',
          margin: 8,
          formatter(value: string, index: number) {
            return `{a|${index + 1}}`;
          },
          rich: {
            a: {
              fontWeight: 500,
              fontSize: 14,
              color: token?.colorTextSecondary
            }
          }
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
        barGap: '20%',
        label: {
          show: true,
          formatter(params: any) {
            if (params.seriesIndex === 0) {
              return `{value|${params.name}}`;
            }
            return '';
          },
          position: 'left',
          align: 'left',
          offset: [5, 18],
          rich: {
            value: {
              textBorderWidth: 0,
              fontSize: 11,
              color: token?.colorTextTertiary
            }
          }
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

  const isEmpty = useMemo(() => {
    return seriesData?.every?.((item: any) => {
      return !item?.data?.length;
    });
  }, [seriesData]);

  return (
    <>
      {isEmpty ? (
        <EmptyData
          height={height}
          title={_.get(title, 'text', title || '')}
        ></EmptyData>
      ) : (
        <Chart
          height={height}
          chartHeight={typeof height === 'number' ? height - 10 : undefined}
          options={dataOptions}
          width={width || '100%'}
        ></Chart>
      )}
    </>
  );
};

export default BarChart;
