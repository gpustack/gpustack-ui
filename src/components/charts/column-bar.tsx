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
    scale: {
      x: {
        type: 'band',
        padding: 0.5
      }
    },
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
      fill: 'linear-gradient(90deg,rgba(84, 204, 152,0.8) 0%,rgb(0, 168, 143,.7) 100%)',
      radiusTopLeft: 12,
      radiusTopRight: 12,
      align: 'center',
      width: 20
    }
  };

  return (
    <>
      <Column {...config} />
    </>
  );
};

export default BarChart;
