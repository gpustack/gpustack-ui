import { Line } from '@ant-design/plots';

interface LineChartProps {
  title?: string;
  height?: number;
  data: any[];
  color?: string[];
  xField?: string;
  yField?: string;
  slider?: boolean;
}
const LineChart: React.FC<LineChartProps> = (props) => {
  const { data, title, color, xField, yField, slider, height } = props;
  const config = {
    title,
    height,
    xField: xField || 'time',
    yField: yField || 'value',
    color: color || ['red', 'blue', 'green', 'yellow'],
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
        tick: false
      }
    },
    // point: {
    //   shapeField: 'circle',
    //   sizeField: 2
    // },
    style: {
      lineWidth: 1.5
    },
    legend: {
      itemMarker: {
        symbol: 'circle'
      },
      color: {
        layout: { justifyContent: 'center' }
      }
    },
    tooltip: {
      title: 'time',
      items: [{ channel: 'y' }]
    }
  };
  return (
    <>
      <Line data={data} {...config} />
    </>
  );
};

export default LineChart;
