import LineChart from '@/components/echarts/line-chart';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import _ from 'lodash';
import { memo, useContext } from 'react';
import { DashboardContext } from '../config/dashboard-context';

const chartColorMap = {
  tickLineColor: 'rgba(217,217,217,0.5)',
  axislabelColor: 'rgba(0, 0, 0, 0.4)'
};

const TypeKeyMap = {
  cpu: {
    label: 'CPU',
    type: 'CPU',
    intl: false,
    color: 'rgba(250, 173, 20,.8)'
  },
  memory: {
    label: 'dashboard.memory',
    type: 'Memory',
    intl: true,
    color: 'rgba(114, 46, 209,.8)'
  },
  gpu: {
    label: 'GPU',
    type: 'GPU',
    intl: false,
    color: 'rgba(84, 204, 152,.8)'
  },
  gpu_memory: {
    label: 'dashboard.vram',
    type: 'VRAM',
    intl: true,
    color: 'rgba(255, 107, 179, 80%)'
  }
};

const option = {
  title: {
    text: ''
  },
  legend: {
    itemWidth: 8,
    itemHeight: 8,
    data: []
  },
  grid: {
    left: 0,
    right: 20,
    bottom: 20,
    containLabel: true
  },
  tooltip: {
    trigger: 'axis',
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
  },
  xAxis: {
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
      // fontFamily: 'unset',
      fontSize: 12
    },
    axisLine: {
      show: false
    },
    data: []
  },
  yAxis: {
    max: 100,
    min: 0,
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed'
      }
    },
    axisLabel: {
      color: chartColorMap.axislabelColor,
      // fontFamily: 'unset',
      fontSize: 12
    },
    axisTick: {
      show: false
    },
    type: 'value'
  },
  series: []
};

const UtilizationOvertime: React.FC = () => {
  console.log('systemload=====================');
  const intl = useIntl();
  const data = useContext(DashboardContext)?.system_load?.history || {};

  const typeList = ['gpu', 'cpu', 'memory', 'gpu_memory'];

  const generateData = () => {
    const legendData: string[] = [];
    const xAxisData: string[] = [];
    let seriesData: { value: number; time: string; type: string }[] = [];
    seriesData = _.map(typeList, (item: string) => {
      const itemConfig = _.get(TypeKeyMap, item, {});
      const name = itemConfig.intl
        ? intl.formatMessage({ id: itemConfig.label })
        : itemConfig.label;
      legendData.push(name);
      const itemDataList = _.get(data, item, []);
      return {
        name: name,
        color: itemConfig.color,
        data: _.map(itemDataList, (item: any) => {
          xAxisData.push(dayjs(item.timestamp * 1000).format('HH:mm:ss'));
          return {
            time: dayjs(item.timestamp * 1000).format('HH:mm:ss'),
            value: _.round(_.get(item, 'value', 0), 1)
          };
        })
      };
    });
    return {
      seriesData,
      legendData,
      xAxisData: _.uniq(xAxisData)
    };
  };
  const { seriesData, legendData, xAxisData } = generateData();

  return (
    <>
      <LineChart
        height={390}
        seriesData={seriesData}
        legendData={legendData}
        xAxisData={xAxisData}
        smooth={true}
        width="100%"
      ></LineChart>
    </>
  );
};

export default memo(UtilizationOvertime);
