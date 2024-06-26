import LineChart from '@/components/charts/line-chart';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { DashboardContext } from '../config/dashboard-context';

const TypeKeyMap = {
  cpu: 'CPU',
  memory: 'Memory',
  gpu: 'GPU',
  gpu_memory: 'VRAM'
};

const UtilizationOvertime: React.FC = () => {
  const data = useContext(DashboardContext)?.system_load?.history || {};
  const [result, setResult] = useState<
    { time: string; value: number; type: string }[]
  >([]);

  const typeList = ['gpu', 'cpu', 'memory', 'gpu_memory'];
  const sliderConfig = {
    y: false,
    x: {
      style: {
        selectionFill: 'rgb(84, 204, 152)',
        selectionFillOpacity: 0.1,
        handleIconFill: 'rgb(84, 204, 152)',
        handleIconFillOpacity: 0.15,
        handleIconStrokeOpacity: 0,
        sparklineType: 'line',
        sparkline: true
      },
      sparkline: true
    }
  };

  const labelFormatter = (value: any) => {
    return `${value}%`;
  };
  const generateData = () => {
    const list: { value: number; time: string; type: string }[] = [];
    _.each(typeList, (type: any) => {
      const dataList = _.map(_.get(data, type, []), (item: any) => {
        return {
          value: _.round(item.value, 2) || 0,
          time: dayjs(item.timestamp * 1000).format('HH:mm:ss'),
          type: _.get(TypeKeyMap, type, '')
        };
      });
      list.push(...dataList);
    });
    setResult(list);
  };

  useEffect(() => {
    generateData();
  }, [data]);

  return (
    <>
      <LineChart
        data={result}
        labelFormatter={labelFormatter}
        slider={sliderConfig}
      />
    </>
  );
};

export default UtilizationOvertime;
