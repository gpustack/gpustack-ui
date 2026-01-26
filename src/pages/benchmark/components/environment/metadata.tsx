import { convertFileSize } from '@/utils';
import { Descriptions, DescriptionsProps } from 'antd';
import React from 'react';
import { WorkerData } from '../../config/detail-types';

const Environment: React.FC<WorkerData> = (props) => {
  const { os, cpu_total, memory_total } = props;

  const items: DescriptionsProps['items'] = [
    {
      key: '4',
      label: 'System',
      children: os.name
    },
    {
      key: '1',
      label: 'CPU Count',
      children: cpu_total
    },
    {
      key: '5',
      label: 'Memory Total',
      children: convertFileSize(memory_total)
    }
  ];
  return (
    <div>
      <Descriptions
        items={items}
        colon={false}
        column={3}
        layout="vertical"
        styles={{
          content: {
            justifyContent: 'flex-start'
          }
        }}
      ></Descriptions>
    </div>
  );
};

export default Environment;
