import { Pie } from '@ant-design/plots';
import numeral from 'numeral';

const TooltipContent = (props: any) => {
  return (
    <div>
      <div>{props.x}</div>
      <div>{props.y}</div>
    </div>
  );
};
const GPUUtilization: React.FC = () => {
  const data = [
    { label: 'Idle GPUs', value: 20 },
    { label: 'Allocated GPUs', value: 120 }
  ];
  return (
    <Pie
      height={340}
      radius={0.9}
      angleField="value"
      colorField="label"
      data={data as any}
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

export default GPUUtilization;
