import { Bar } from '@ant-design/plots';
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
  showYAxis?: boolean;
}
const BarChart: React.FC<BarChartProps> = (props) => {
  const {
    data,
    xField,
    yField,
    title,
    height,
    group,
    colorField,
    seriesField,
    stack,
    showYAxis = true,
    legend = undefined
  } = props;
  const config = {
    data,
    xField,
    yField,
    colorField: colorField || 'name',
    direction: 'vertical',
    seriesField,
    height,
    group,
    stack,
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
    scale: {
      x: {
        type: 'band',
        padding: 0.5
      }
    },
    axis: {
      x: {
        xAxis: true,
        tick: false
      },
      y: showYAxis
        ? {
            tick: false
          }
        : null
    },
    title: {
      title,
      style: {
        align: 'start',
        titleFontSize: 14,
        titleFill: 'rgba(0,0,0,0.88)',
        titleFontWeight: 500
      }
    },
    split: {
      type: 'line',
      line: {
        style: {
          lineDash: [4, 5]
        }
      }
    },
    markBackground: {},
    style: {
      fill: (params: any) => {
        return (
          params.color ||
          'linear-gradient(90deg,rgba(84, 204, 152,0.8) 0%,rgb(0, 168, 143,.7) 100%)'
        );
      },
      // radiusTopLeft: 12,
      // radiusTopRight: 12,
      height: 20
    }
  };

  return (
    <>
      {data.length === 0 ? (
        <EmptyData height={height} title={title} />
      ) : (
        <Bar {...config} />
      )}
    </>
  );
};

export default BarChart;
