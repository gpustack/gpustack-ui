import PageTools from '@/components/page-tools';
import { Line } from '@ant-design/plots';
import { DatePicker } from 'antd';
import _ from 'lodash';

const UtilizationOvertime: React.FC = () => {
  const timeList = [
    '01:00:00',
    '02:00:00',
    '03:00:00',
    '04:00:00',
    '05:00:00',
    '06:00:00',
    '07:00:00',
    '08:00:00',
    '09:00:00',
    '10:00:00',
    '11:00:00',
    '12:00:00',
    '13:00:00',
    '14:00:00',
    '15:00:00'
  ];
  const typeList = ['GPU', 'CPU', 'Memory'];
  const generateData = () => {
    const data = [];
    for (let i = 0; i < timeList.length; i++) {
      for (let j = 0; j < typeList.length; j++) {
        data.push({
          time: timeList[i],
          type: typeList[j],
          value: _.round(Math.random(), 3)
        });
      }
    }
    return data;
  };
  const data = generateData();

  const handleSelectDate = (date: string) => {
    console.log('dateString============', date);
  };
  const config = {
    xField: 'time',
    yField: 'value',
    color: ['red', 'blue', 'green'],
    colorField: 'type',
    slider: false,
    shapeField: 'smooth',
    axis: {
      x: {
        textStyle: {
          autoRoate: true
        }
      }
    },
    point: {
      shapeField: 'circle',
      sizeField: 2
    },
    style: {
      lineWidth: 1.4
    },
    legend: {
      color: {
        layout: { justifyContent: 'center' }
      }
    },
    tooltip: {
      title: 'time',
      items: [{ channel: 'y' }]
    },
    label: {
      autoRotate: true
    }
  };
  return (
    <>
      <PageTools
        marginBottom={10}
        marginTop={0}
        left={<span>Utilization Over Time</span>}
        right={
          <DatePicker onChange={handleSelectDate} style={{ width: 300 }} />
        }
      />
      <Line height={400} data={data} {...config} />
    </>
  );
};

export default UtilizationOvertime;
