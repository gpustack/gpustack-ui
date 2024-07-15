import { isFunction } from 'lodash';
const chartColorMap = {
  tickLineColor: 'rgba(217,217,217,0.5)',
  axislabelColor: 'rgba(0, 0, 0, 0.4)'
};

export const tooltip = {
  trigger: 'axis',
  // axisPointer: {
  //   type: 'shadow'
  // }
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

export const grid = {
  left: 0,
  right: 20,
  bottom: 20,
  containLabel: true
};

export const legend = {
  itemWidth: 8,
  itemHeight: 8
};

export const xAxis = {
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

export const yAxis = {
  // max: 100,
  // min: 0,
  nameTextStyle: {
    padding: [0, 0, 0, -20]
  },
  splitLine: {
    show: true,
    lineStyle: {
      type: 'dashed'
    }
  },
  axisLabel: {
    color: chartColorMap.axislabelColor,
    fontSize: 12
  },
  axisTick: {
    show: false
  },
  type: 'value'
};

export const title = {
  show: true,
  left: 'center',
  textStyle: {
    fontSize: 12,
    color: '#000'
  },
  text: ''
};

export const barItemConfig = {
  type: 'bar',
  barMaxWidth: 20,
  barMinWidth: 8,
  // stack: 'total',
  barGap: '30%',
  barCategoryGap: '50%'
};

export const lineItemConfig = {
  type: 'line',
  smooth: true,
  showSymbol: false,
  itemStyle: {},
  lineStyle: {
    width: 1.5,
    opacity: 0.7
  }
};

export const gaugeItemConfig = {
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
      // color: [[1, 'rgba(221, 221, 221, 0.5)']],
      color: [
        [0.5, 'rgba(84, 204, 152, 80%)'],
        [0.8, 'rgba(250, 173, 20, 80%)'],
        [1, 'rgba(255, 77, 79, 80%)']
      ]
    }
  },
  axisTick: {
    distance: -12,
    length: 6,
    splitNumber: 5,
    lineStyle: {
      width: 1.5,
      color: 'rgba(255, 255, 255, 1)'
    }
  },
  splitLine: {
    distance: -12,
    length: 12,
    lineStyle: {
      width: 1.5,
      color: 'rgba(255, 255, 255, 1)'
    }
  },
  axisLabel: {
    distance: 14,
    color: 'rgba(0, 0, 0, .5)',
    fontSize: 12
  },
  detail: {
    lineHeight: 40,
    height: 40,
    offsetCenter: [5, 30],
    valueAnimation: false,
    fontSize: 20,
    color: 'rgba(0, 0, 0, 0.88)',
    formatter(value: any) {
      return '{value|' + value + '}{unit|%}';
    },
    rich: {
      value: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(0, 0, 0, 0.88)'
      },
      unit: {
        fontSize: 14,
        color: 'rgba(0, 0, 0, 0.88)',
        fontWeight: '500',
        padding: [0, 0, 0, 2]
      }
    }
  }
};
