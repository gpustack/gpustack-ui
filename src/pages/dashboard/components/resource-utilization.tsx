import LineChart from '@/components/echarts/line-chart';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';

const TypeKeyMap = {
  cpu: {
    label: 'CPU',
    type: 'CPU',
    intl: false,
    color: 'rgba(250, 173, 20,.8)'
  },
  ram: {
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
  vram: {
    label: 'dashboard.vram',
    type: 'VRAM',
    intl: true,
    color: 'rgba(255, 107, 179, 80%)'
  }
};

const UtilizationOvertime: React.FC<{
  data: {
    cpu: {
      timestamp: number;
      value: number;
    }[];
    ram: {
      timestamp: number;
      value: number;
    }[];
    gpu: {
      timestamp: number;
      value: number;
    }[];
    vram: {
      timestamp: number;
      value: number;
    }[];
  };
}> = ({ data }) => {
  const intl = useIntl();

  const typeList = ['gpu', 'cpu', 'ram', 'vram'];

  const tooltipValueFormatter = (value: any) => {
    return !value ? value : `${value}%`;
  };

  const generateData = useMemo(() => {
    const legendData: string[] = [];
    const xAxisData: string[] = [];
    let seriesData: { value: number; time: string; type: string }[] = [];
    seriesData = _.map(typeList, (label: string) => {
      const itemConfig = _.get(TypeKeyMap, label, {});
      const name = itemConfig.intl
        ? intl.formatMessage({ id: itemConfig.label })
        : itemConfig.label;
      legendData.push(name);
      const itemDataList = _.get(data, label, []);
      return {
        name: name,
        color: itemConfig.color,
        data: _.map(itemDataList, (item: any) => {
          const time = dayjs(item.timestamp * 1000).format('HH:mm:ss');
          xAxisData.push(time);
          return {
            time: item,
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
  }, [data, intl]);

  return (
    <>
      <LineChart
        height={390}
        seriesData={generateData.seriesData}
        legendData={generateData.legendData}
        xAxisData={generateData.xAxisData}
        tooltipValueFormatter={tooltipValueFormatter}
        smooth={true}
        width="100%"
        yAxisName="(%)"
      ></LineChart>
    </>
  );
};

export default UtilizationOvertime;
