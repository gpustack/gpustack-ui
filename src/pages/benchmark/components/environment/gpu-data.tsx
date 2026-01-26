import { convertFileSize } from '@/utils';
import { Descriptions, DescriptionsProps } from 'antd';
import React from 'react';
import { GPUData } from '../../config/detail-types';
import Section from '../summary/section';

const Environment: React.FC<GPUData> = (props) => {
  const items: DescriptionsProps['items'] = [
    {
      key: '4',
      label: 'Name',
      children: props.name
    },
    {
      key: '1',
      label: 'VRAM',
      children: convertFileSize(props.memory_total)
    },
    {
      key: '3',
      label: 'Driver Version',
      children: props.driver_version
    },
    {
      key: '2',
      label: 'Runtime Version',
      children: props.runtime_version
    },
    {
      key: '6',
      label: 'Core',
      children: props.core_total
    },
    {
      key: '5',
      label: 'Vendor',
      children: props.vendor
    }
  ];
  return (
    <Section title={`GPU ${props.index}`}>
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
    </Section>
  );
};

export default Environment;
