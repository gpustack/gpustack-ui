import LineChart from '@/components/echarts/line-chart';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';

interface TrendChartProps {
  data: any;
  metrics: string[];
  metricsMap: Record<string, any>;
  title: string;
}

const titleOptions = {
  left: 0
};

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  metrics,
  metricsMap,
  title
}) => {
  const intl = useIntl();

  const tooltipValueFormatter = (value: any) => {
    return !value ? value : `${value}%`;
  };

  const generateData = useMemo(() => {
    const legendData: string[] = [];
    const xAxisData: string[] = [];
    let seriesData: { value: number; time: string; type: string }[] = [];
    seriesData = _.map(metrics, (item: string) => {
      const itemConfig = _.get(metricsMap, item, {});
      const name = itemConfig.intl
        ? intl.formatMessage({ id: itemConfig.label })
        : itemConfig.label;
      legendData.push(name);
      const itemDataList = _.get(data, item, []);
      console.log('itemConfig:', itemConfig.color);
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
  }, [data, intl]);

  return (
    <>
      <LineChart
        height={320}
        title={title}
        showArea={false}
        seriesData={generateData.seriesData}
        legendData={generateData.legendData}
        xAxisData={generateData.xAxisData}
        tooltipValueFormatter={tooltipValueFormatter}
        smooth={true}
        width="100%"
        yAxisName="(%)"
        titleOptions={titleOptions}
      ></LineChart>
    </>
  );
};

export default TrendChart;
