import { useIntl } from '@umijs/max';
import { Descriptions, DescriptionsProps } from 'antd';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';

const Benchmark: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();

  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: intl.formatMessage({ id: 'benchmark.form.profile' }),
      children: detailData?.profile || '-'
    },
    {
      key: '2',
      label: intl.formatMessage({ id: 'benchmark.table.dataset' }),
      children: detailData?.dataset_name || '-'
    },
    {
      key: '3',
      label: intl.formatMessage({
        id: 'benchmark.detail.inputOutputTokenLength'
      }),
      children: (
        <span>
          {detailData?.dataset_input_tokens || '-'} /{' '}
          {detailData?.dataset_output_tokens || '-'}
        </span>
      )
    },
    {
      key: '7',
      label: intl.formatMessage({ id: 'benchmark.form.totalRequests' }),
      children: detailData?.total_requests || '-'
    },
    {
      key: '6',
      label: intl.formatMessage({ id: 'benchmark.table.requestRate' }),
      children: detailData?.request_rate || '-'
    },
    {
      key: '5',
      label: intl.formatMessage({ id: 'playground.image.params.seed' }),
      children: detailData?.seed || '-'
    }
  ];

  return (
    <div>
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
