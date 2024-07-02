import { Column } from '@ant-design/plots';

import EmptyData from './empty-data';

interface BarChartProps {
  data: any[];
  xField: string;
  yField: string;
  title?: string;
  height?: number;
  group?: boolean;
  colorField?: string;
  seriesField?: string;
  stack?: boolean;
  legend?: any;
  labelFormatter?: (v: any) => string;
}
const BarChart: React.FC<BarChartProps> = (props) => {
  const {
    data,
    xField,
    yField,
    title,
    height = 260,
    group,
    colorField,
    seriesField,
    stack,
    legend = undefined,
    labelFormatter
  } = props;
  const config = {
    data,
    xField,
    yField,
    colorField: colorField || 'name',
    direction: 'vertical',
    stack,
    seriesField,
    height,
    group,
    scale: {
      x: {
        type: 'band',
        padding: 0.5
      }
    },
    legend:
      legend === 'undefined'
        ? {
            color: {
              position: 'top',
              layout: {
                justifyContent: 'center'
              }
            }
          }
        : legend,
    axis: {
      x: {
        xAxis: true,
        tick: false,
        labelFormatter
      },
      y: {
        tick: false,
        labelAutoWrap: true
      }
    },
    title: {
      title,
      style: {
        align: 'center',
        titleFontSize: 14,
        titleFill: 'rgba(0,0,0,0.88)',
        titleFontWeight: 500
      }
    },
    split: {
      type: 'line',
      line: {
        color: 'red',
        style: {
          color: 'red',
          lineDash: [4, 5]
        }
      }
    },

    style: {
      fill: (params: any) => {
        return params.color || 'rgba(84, 204, 152,0.8)';
      },
      // radiusTopLeft: 12,
      // radiusTopRight: 12,
      align: 'center',
      width: 20
    }
  };

  return (
    <>
      {data.length > 0 ? (
        <Column {...config} />
      ) : (
        <EmptyData height={height} title={title} />
      )}
    </>
  );
};

export default BarChart;
