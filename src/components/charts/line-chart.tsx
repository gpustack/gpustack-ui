import { Line } from '@ant-design/plots';
import EmptyData from './empty-data';

interface LineChartProps {
  title?: string;
  height?: number;
  data: any[];
  color?: string[];
  xField?: string;
  yField?: string;
  locale?: string;
  labelFormatter?: (v: any) => string;
  slider?: any;
}
const LineChart: React.FC<LineChartProps> = (props) => {
  const {
    data,
    title,
    color,
    xField,
    locale,
    yField,
    slider,
    height,
    labelFormatter
  } = props;
  const config = {
    title,
    height,
    xField: xField || 'time',
    yField: yField || 'value',
    // color: color || ['red', 'blue', 'green', 'yellow'],
    colorField: 'type',
    autoFit: true,
    slider,
    shapeField: 'smooth',
    axis: {
      x: {
        textStyle: {
          autoRoate: true
        }
      },
      y: {
        tick: false,
        // size: 14,
        // title: '%',
        titlePosition: 'top',
        titleFontSize: 12,
        labelFormatter
      }
    },
    // point: {
    //   shapeField: 'circle',
    //   sizeField: 2
    // },
    style: {
      lineWidth: 1.5,
      opacity: 0.8
      // stroke: (params: any) => {
      //   return (
      //     params.color ||
      //     'linear-gradient(90deg,rgba(84, 204, 152,0.8) 0%,rgba(0, 168, 143,.7) 100%)'
      //   );
      // }
    },
    legend: {
      color: {
        layout: { justifyContent: 'center' }
      },

      size: {
        itemLabelFontSize: 14,
        itemLabelFontWeight: 500
      }
    },
    tooltip: {
      title: 'time',
      items: [{ channel: 'y' }]
    }
  };
  return (
    <>
      {data.length === 0 ? (
        <EmptyData height={height} title={title} />
      ) : (
        <Line data={data} {...config} />
      )}
    </>
  );
};

export default LineChart;
