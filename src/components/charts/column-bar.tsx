import { Column } from '@ant-design/plots';

interface BarChartProps {
  data: any[];
  xField: string;
  yField: string;
  title?: string;
  height?: number;
}
const BarChart: React.FC<BarChartProps> = (props) => {
  const { data, xField, yField, title, height = 260 } = props;
  const config = {
    data,
    xField,
    yField,
    // colorField: 'name',
    direction: 'vertical',
    height,
    group: true,
    legend: {
      color: {
        position: 'top',
        layout: {
          justifyContent: 'center'
        }
      }
    },
    axis: {
      x: {
        xAxis: true
      }
    },
    title: {
      title,
      style: {
        align: 'center'
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
      fill: '#54cc98',
      radiusTopLeft: 8,
      radiusTopRight: 8,
      width: 30
    }
  };

  return (
    <>
      <Column {...config} />
    </>
  );
};

export default BarChart;
