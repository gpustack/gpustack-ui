import { Pie } from '@ant-design/plots';
import numeral from 'numeral';

interface PieChartProps {
  data: { label: string; value: number }[];
  height?: number;
  radius?: number;
}
const PieChart: React.FC<PieChartProps> = (props) => {
  const { data, height = 340, radius = 0.9 } = props;

  return (
    <Pie
      height={height}
      radius={radius}
      angleField="value"
      colorField="label"
      data={data}
      legend={{
        color: {
          position: 'bottom',
          layout: {
            justifyContent: 'center'
          }
        }
      }}
      label={{
        position: 'outside',
        text: (item: { label: number; value: number }) => {
          return `${item.label}: ${numeral(item.value).format('0,0')}`;
        }
      }}
    />
  );
};

export default PieChart;
