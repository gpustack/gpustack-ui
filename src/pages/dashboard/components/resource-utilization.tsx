import LineChart from '@/components/charts/line-chart';
import { generateRandomArray } from '@/utils';
import _ from 'lodash';

const mockData = {
  GPU: generateRandomArray(),
  CPU: generateRandomArray(),
  Memory: generateRandomArray(),
  VRAM: generateRandomArray()
};
const UtilizationOvertime: React.FC = () => {
  const timeList = [
    // '01:00:00',
    // '02:00:00',
    // '03:00:00',
    // '04:00:00',
    // '05:00:00',
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
  const typeList = ['GPU', 'CPU', 'Memory', 'VRAM'];
  const generateData = () => {
    const data = [];
    for (let i = 0; i < timeList.length; i++) {
      for (let j = 0; j < typeList.length; j++) {
        data.push({
          time: timeList[i],
          type: typeList[j],
          value: _.get(mockData, typeList[j])[i]
        });
      }
    }
    return data;
  };
  const data = generateData();

  // <DatePicker onChange={handleSelectDate} style={{ width: 300 }} />
  return (
    <>
      <LineChart height={400} data={data} />
    </>
  );
};

export default UtilizationOvertime;
