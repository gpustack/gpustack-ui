const chartColorMap = {
  tickLineColor: 'rgba(217,217,217,0.5)',
  axislabelColor: 'rgba(0, 0, 0, 0.4)'
};

export const tooltip = {
  trigger: 'axis',
  // axisPointer: {
  //   type: 'shadow'
  // }
  formatter(params: any) {
    let result = `<span class="tooltip-x-name">${params[0].axisValue}</span>`;
    params.forEach((item: any) => {
      result += `<span class="tooltip-item">
     <span class="tooltip-item-name">
       <span style="display:inline-block;margin-right:5px;border-radius:8px;width:8px;height:8px;background-color:${item.color};"></span>
       <span class="tooltip-title">${item.seriesName}</span>:
     </span>
      <span class="tooltip-value">${item.data.value}</span>
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
  boundaryGap: true,
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
