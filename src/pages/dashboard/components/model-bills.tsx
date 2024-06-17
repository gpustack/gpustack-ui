import PageTools from '@/components/page-tools';
import { Column } from '@ant-design/plots';
import { DatePicker, Select, Space } from 'antd';
import { useState } from 'react';

const { RangePicker } = DatePicker;

const ModelBills: React.FC = () => {
  const [selectName, setSelectName] = useState('model1');
  const handleNameChange = (value: string) => {
    setSelectName(value);
  };
  const models = [
    {
      value: 'model1',
      label: 'model1'
    },
    {
      value: 'model2',
      label: 'model2'
    },
    {
      value: 'model3',
      label: 'model3'
    }
  ];
  const config = {
    data: [
      {
        time: '2021-01',
        name: 'model1',
        value: 3.9
      },
      {
        time: '2021-01',
        name: 'model2',
        value: 4.3
      },
      {
        time: '2021-01',
        name: 'model3',
        value: 3.8
      },
      {
        time: '2021-02',
        name: 'model1',
        value: 4.1
      },
      {
        time: '2021-02',
        name: 'model2',
        value: 5.7
      },
      {
        time: '2021-02',
        name: 'model3',
        value: 3.9
      },
      {
        time: '2021-03',
        name: 'model1',
        value: 5.6
      },
      {
        time: '2021-03',
        name: 'model2',
        value: 7.3
      },
      {
        time: '2021-03',
        name: 'model3',
        value: 4.9
      },
      {
        time: '2021-04',
        name: 'model1',
        value: 7.2
      },
      {
        time: '2021-04',
        name: 'model2',
        value: 9.6
      },
      {
        time: '2021-04',
        name: 'model3',
        value: 6.3
      },
      {
        time: '2021-05',
        name: 'model1',
        value: 9.3
      },
      {
        time: '2021-05',
        name: 'model2',
        value: 11.9
      },
      {
        time: '2021-05',
        name: 'model3',
        value: 8.6
      },
      {
        time: '2021-06',
        name: 'model1',
        value: 10.3
      },
      {
        time: '2021-06',
        name: 'model2',
        value: 13.9
      },
      {
        time: '2021-06',
        name: 'model3',
        value: 9.6
      }
    ],
    xField: 'time',
    yField: 'value',
    colorField: 'name',
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
      radiusTopLeft: 10,
      radiusTopRight: 10,
      width: 25
    }
  };

  const handleSelectDate = (value: any) => {
    console.log(value);
  };
  return (
    <>
      <PageTools
        marginBottom={10}
        marginTop={0}
        left={false}
        right={
          <Space>
            <Select
              size="middle"
              options={models}
              value={selectName}
              style={{ width: 300, height: 34 }}
              onChange={handleNameChange}
            ></Select>
            <RangePicker
              showTime={false}
              format="YYYY-MM-DD"
              onChange={(value, dateString) => {
                console.log('Selected Time: ', value);
                console.log('Formatted Selected Time: ', dateString);
              }}
              onOk={handleSelectDate}
            />
          </Space>
        }
      ></PageTools>
      <Column {...config} />
    </>
  );
};

export default ModelBills;
