import { CardContainer } from '@/pages/llmodels/components/gpu-card';
import React from 'react';

const InstanceTypeOption: React.FC<{
  data: any;
  header?: React.ReactNode;
  info?: React.ReactNode;
}> = ({ data, header, info }) => {
  console.log('InstanceTypeOption render', {
    data,
    header,
    info
  });
  return (
    <CardContainer
      header={<span>{data.label}</span>}
      description={<span>{data.description}</span>}
    ></CardContainer>
  );
};

export default InstanceTypeOption;
