import { useIntl } from '@umijs/max';
import { Descriptions } from 'antd';
import { DescriptionsItemType } from 'antd/es/descriptions';
import React from 'react';
import { DatasetValueMap } from '../../config';
import { useDetailContext } from '../../config/detail-context';

const Benchmark: React.FC = () => {
  const intl = useIntl();
  const { detailData, profilesOptions } = useDetailContext();

  type ItemTyp = DescriptionsItemType & { hidden?: boolean };
  const items: ItemTyp[] = [
    {
      key: '1',
      label: intl.formatMessage({ id: 'benchmark.form.profile' }),
      children:
        profilesOptions.find((option) => option.value === detailData?.profile)
          ?.label ||
        detailData?.profile ||
        '-'
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
      hidden: detailData?.dataset_name === DatasetValueMap.ShareGPT,
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
      hidden: detailData?.dataset_name === DatasetValueMap.ShareGPT,
      children: detailData?.dataset_seed || '-'
    }
  ];

  return (
    <div>
      <Descriptions
        items={items.filter((item) => !item.hidden)}
        colon={false}
        column={detailData?.dataset_name === DatasetValueMap.ShareGPT ? 2 : 3}
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
