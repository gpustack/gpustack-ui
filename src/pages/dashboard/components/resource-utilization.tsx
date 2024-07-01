import LineChart from '@/components/charts/line-chart';
import { getLocale, useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
import { DashboardContext } from '../config/dashboard-context';

const TypeKeyMap = {
  cpu: {
    label: 'CPU',
    type: 'CPU',
    intl: false,
    color:
      'linear-gradient(90deg,rgba(84, 204, 152,0.8) 0%,rgba(0, 168, 143,.7) 100%)'
  },
  memory: {
    label: 'dashboard.memory',
    type: 'Memory',
    intl: true,
    color:
      'linear-gradient(90deg,rgba(249, 248, 113,.8) 0%,rgba(255, 199, 92,0.7) 100%)'
  },
  gpu: {
    label: 'GPU',
    type: 'GPU',
    intl: false,
    color: 'rgba(84, 204, 152,0.8)'
  },
  gpu_memory: {
    label: 'dashboard.vram',
    type: 'VRAM',
    intl: true,
    color:
      'linear-gradient(90deg,rgba(84, 204, 152,0.8) 0%,rgba(0, 168, 143,.7) 100%)'
  }
};

const UtilizationOvertime: React.FC = () => {
  const intl = useIntl();
  const locale = getLocale();
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
  const generateData = useCallback(() => {
    const list: { value: number; time: string; type: string }[] = [];
    _.each(typeList, (type: any) => {
      const dataList = _.map(_.get(data, type, []), (item: any) => {
        const value = _.round(_.get(item, 'value', 0), 1);
        const time = dayjs(item.timestamp * 1000).format('HH:mm:ss');
        const itemtype = _.get(TypeKeyMap, [type, 'intl'], false)
          ? intl.formatMessage({
              id: _.get(TypeKeyMap, [type, 'label'], '')
            })
          : _.get(TypeKeyMap, [type, 'label'], '');
        return {
          value,
          time,
          type: itemtype,
          color: 'red'
        };
      });
      list.push(...dataList);
    });
    setResult(list);
  }, [data, locale]);

  useEffect(() => {
    generateData();
  }, [data, locale]);

  return (
    <>
      <LineChart
        data={result}
        locale={locale}
        height={390}
        labelFormatter={labelFormatter}
        slider={sliderConfig}
      />
    </>
  );
};

export default UtilizationOvertime;
