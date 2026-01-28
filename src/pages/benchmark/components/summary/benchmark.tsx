import { Descriptions, DescriptionsProps } from 'antd';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';
import Title from './title';

const Benchmark: React.FC = () => {
  const { detailData } = useDetailContext();

  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: 'Profile',
      children: detailData?.profile || '-'
    },
    {
      key: '2',
      label: 'Dataset',
      children: detailData?.dataset_name || '-'
    },
    {
      key: '3',
      label: 'Token Length (Prompt/Output)',
      children: (
        <span>
          {detailData?.dataset_prompt_tokens || '-'} /{' '}
          {detailData?.dataset_output_tokens || '-'}
        </span>
      )
    },
    {
      key: '7',
      label: 'Total Requests',
      children: detailData?.total_requests || '-'
    },
    {
      key: '6',
      label: 'Request Rate',
      children: detailData?.request_rate || '-'
    },
    {
      key: '5',
      label: 'Seed',
      children: detailData?.seed || '-'
    }
  ];

  return (
    <div>
      <Title>Parameters</Title>
      <Descriptions
        items={items}
        colon={false}
        column={3}
        styles={{
          content: {
            justifyContent: 'flex-start'
          }
        }}
      ></Descriptions>
    </div>
  );
};

export default Benchmark;
