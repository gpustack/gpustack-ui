import AutoTooltip from '@/components/auto-tooltip';
import { convertFileSize } from '@/utils';
import { Descriptions, DescriptionsProps } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { GPUData } from '../../config/detail-types';
import Section from '../summary/section';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  .name {
    font-weight: 500;
  }
`;

const Environment: React.FC<GPUData> = (props) => {
  const items: DescriptionsProps['items'] = [
    // {
    //   key: '4',
    //   label: 'Name',
    //   children: <AutoTooltip ghost>{props.name}</AutoTooltip>
    // },
    {
      key: '1',
      label: 'VRAM',
      children: convertFileSize(props.memory_total)
    },
    {
      key: '3',
      label: 'Driver',
      children: props.driver_version
    },
    {
      key: '2',
      label: 'Runtime',
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
    },
    {
      key: '7',
      label: 'GPU Type',
      children: props.type
    }
  ];
  return (
    <Section
      title={
        <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
          GPU {props.index}
        </span>
      }
    >
      <Content>
        <div className="name">
          <AutoTooltip ghost>{props.name}</AutoTooltip>
        </div>
        <Descriptions
          items={items}
          colon={true}
          column={3}
          styles={{
            content: {
              justifyContent: 'flex-start'
            }
          }}
        ></Descriptions>
      </Content>
    </Section>
  );
};

export default Environment;
