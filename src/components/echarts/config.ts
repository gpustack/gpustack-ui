import useUserSettings from '@/hooks/use-user-settings';
import { formatLargeNumber } from '@/utils';
import { theme } from 'antd';
import { isFunction } from 'lodash';
import { useMemo } from 'react';

export const grid = {
  left: 0,
  right: 20,
  bottom: 20,
  containLabel: true
};

export default function useChartConfig() {
  const { userSettings, isDarkTheme } = useUserSettings();
  const { useToken } = theme;
  const { token } = useToken();

  console.log('token:', token);

  const chartColorMap = useMemo(() => {
    return {
      titleColor: token.colorText,
      splitLineColor: token.colorBorder,
      tickLineColor: token.colorSplit,
      axislabelColor: token.colorTextTertiary,
      gaugeBgColor: token.colorFillSecondary,
      gaugeSplitLineColor: isDarkTheme
        ? 'rgba(255,255,255,.3)'
        : 'rgba(255, 255, 255, 1)',
      gaugeSplitLineColor2: isDarkTheme
        ? 'rgba(255,255,255,.5)'
        : 'rgba(255, 255, 255, 1)',
      colorBgContainerHover: isDarkTheme ? '#424242' : '#fff'
    };
  }, [userSettings.theme, isDarkTheme]);

  const tooltip = {
    trigger: 'axis',
    backgroundColor: chartColorMap.colorBgContainerHover,
    borderColor: 'transparent',
    formatter(params: any, callback?: (val: any) => any) {
      let result = `<span class="tooltip-x-name">${params[0].axisValue}</span>`;
      params.forEach((item: any) => {
        let value = isFunction(callback)
          ? callback?.(item.data.value)
          : item.data.value;
        result += `<span class="tooltip-item">
     <span class="tooltip-item-name">
       <span style="display:inline-block;margin-right:5px;border-radius:8px;width:8px;height:8px;background-color:${item.color};"></span>
       <span class="tooltip-title">${item.seriesName}</span>:
     </span>
      <span class="tooltip-value">${value}</span>
      </span>`;
      });
      return `<div class="tooltip-wrapper">${result}</div>`;
    }
  };

  const legend = {
    itemWidth: 8,
    itemHeight: 8,
    textStyle: {
      color: chartColorMap.axislabelColor
    }
  };

  const xAxis = {
    type: 'category',
    axisTick: {
      show: true,
      lineStyle: {
        color: chartColorMap.tickLineColor
      }
    },
    axisLabel: {
      color: chartColorMap.axislabelColor,
      fontSize: 12
    },
    axisLine: {
      show: false
    }
  };

  const yAxis = {
    nameTextStyle: {
      padding: [0, 0, 0, -20]
    },
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        color: chartColorMap.splitLineColor
      }
    },
    axisLabel: {
      color: chartColorMap.axislabelColor,
      fontSize: 12,
      formatter: formatLargeNumber
    },
    axisTick: {
      show: false
    },
    type: 'value'
  };

  const title = {
    show: true,
    left: 'center',
    textStyle: {
      fontSize: 12,
      color: chartColorMap.titleColor
    },
    text: ''
  };

  const barItemConfig = {
    type: 'bar',
    barMaxWidth: 20,
    barMinWidth: 8,
    // stack: 'total',
    barGap: '30%',
    barCategoryGap: '50%'
  };

  const lineItemConfig = {
    type: 'line',
    smooth: true,
    showSymbol: false,
    itemStyle: {},
    lineStyle: {
      width: 1.5,
      opacity: 0.7
    }
  };

  const gaugeItemConfig = {
    type: 'gauge',
    radius: '88%',
    center: ['50%', '65%'],
    startAngle: 190,
    endAngle: -10,
    min: 0,
    max: 100,
    splitNumber: 5,
    progress: {
      show: true,
      roundCap: false,
      width: 12
    },
    pointer: {
      length: '80%',
      width: 4,
      itemStyle: {
        color: 'auto'
      }
    },
    axisLine: {
      roundCap: false,
      lineStyle: {
        width: 12,
        color: [
          [0.5, 'rgba(84, 204, 152, 80%)'],
          [0.8, 'rgba(250, 173, 20, 80%)'],
          [1, 'rgba(255, 77, 79, 80%)']
        ]
      }
    },
    axisTick: {
      distance: -11,
      length: 6,
      splitNumber: 5,
      lineStyle: {
        width: 1.5,
        color: chartColorMap.gaugeSplitLineColor
      }
    },
    splitLine: {
      distance: -5,
      length: 5,
      lineStyle: {
        width: 1.5,
        color: chartColorMap.gaugeSplitLineColor2
      }
    },
    axisLabel: {
      distance: 14,
      color: chartColorMap.axislabelColor,
      fontSize: 12
    },
    detail: {
      lineHeight: 40,
      height: 40,
      offsetCenter: [5, 30],
      valueAnimation: false,
      fontSize: 20,
      color: chartColorMap.titleColor,
      formatter(value: any) {
        return '{value|' + value + '}{unit|%}';
      },
      rich: {
        value: {
          fontSize: 16,
          fontWeight: '500',
          color: chartColorMap.titleColor
        },
        unit: {
          fontSize: 14,
          color: chartColorMap.titleColor,
          fontWeight: '500',
          padding: [0, 0, 0, 2]
        }
      }
    }
  };

  return {
    tooltip,
    grid,
    legend,
    xAxis,
    yAxis,
    title,
    chartColorMap,
    barItemConfig,
    lineItemConfig,
    gaugeItemConfig,
    isDark: isDarkTheme
  };
}
