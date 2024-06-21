import { Bar } from '@ant-design/plots';

interface BarChartProps {
  data: any[];
  xField: string;
  yField: string;
  title?: string;
  height?: number;
}
const BarChart: React.FC<BarChartProps> = (props) => {
  const { data, xField, yField, title, height } = props;
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
      y: {
        tick: false
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
        style: {
          lineDash: [4, 5]
        }
      }
    },
    markBackground: {},
    style: {
      fill: 'linear-gradient(180deg,rgba(84, 204, 152,0.8) 0%,rgb(0, 168, 143,.7) 100%)',
      radiusTopLeft: 12,
      radiusTopRight: 12,
      height: 30
    }
  };

  return (
    <>
      <Bar {...config} />
    </>
  );
};

export default BarChart;
