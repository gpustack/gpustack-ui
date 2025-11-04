import Chart from '@/components/echarts/chart';
import useChartConfig from '@/components/echarts/config';
import EmptyData from '@/components/empty-data';
import React from 'react';
import { ChartProps } from './types';

const strokeColorFunc = (percent: number) => {
  if (percent <= 50 || percent === undefined) {
    return 'rgb(84, 204, 152, 80%)';
  }
  if (percent <= 80) {
    return 'rgba(250, 173, 20, 80%)';
  }
  return 'rgba(255, 77, 79, 80%)';
};

const GaugeChart: React.FC<Omit<ChartProps, 'seriesData' | 'xAxisData'>> = (
  props
) => {
  const {
    gaugeItemConfig,
    title: titleConfig,
    chartColorMap
  } = useChartConfig();
  const { value, height, width, labelFormatter, title, color, gaugeConfig } =
    props;
  const titleText = typeof title === 'string' ? title : title?.text;

  if (!value && value !== 0) {
    return <EmptyData height={height} title={titleText}></EmptyData>;
  }

  const setDataOptions = () => {
    const colorValue = color || strokeColorFunc(value);
    const combineGaugeConfig = {
      ...gaugeItemConfig,
      ...gaugeConfig
    };

    combineGaugeConfig.detail.rich.value.color = colorValue;
    combineGaugeConfig.detail.rich.unit.color = colorValue;

    return {
      title: {
        ...titleConfig,
        text: titleText,
        textStyle: {
          fontSize: 12,
          color: chartColorMap.colorSecondary,
          fontWeight: 400
        },
        top: 10,
        left: 'center',
        ...(typeof title === 'object' ? title : {})
      },
      series: [
        {
          ...combineGaugeConfig,
          axisLine: {
            ...combineGaugeConfig.axisLine,
            lineStyle: {
              ...combineGaugeConfig.axisLine.lineStyle,
              color: [
                [value / 100, colorValue],
                [1, chartColorMap.gaugeBgColor]
              ]
            }
          },
          itemStyle: {
            color: 'transparent'
          },
          detail: {
            ...combineGaugeConfig.detail,
            borderColor: colorValue,
            lineHeight: 20,
            height: 18,
            width: 50,
            formatter: labelFormatter || gaugeItemConfig.detail.formatter
          },
          data: [{ value }]
        }
      ]
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

export default GaugeChart;
