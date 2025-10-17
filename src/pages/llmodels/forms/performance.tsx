import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { deployFormKeyMap } from '../config';
import { useFormContext } from '../config/form-context';
import KVCacheForm from './kv-cache';
import SpeculativeDecode from './speculative-decode';

const flavorTipsList = [
  {
    title: 'Throughput',
    tips: 'models.form.flavor.throughput.tips'
  },
  {
    title: 'Latency',
    tips: 'models.form.flavor.latency.tips'
  },
  {
    title: 'Reference',
    tips: 'models.form.flavor.reference.tips'
  }
];

const Performance: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { formKey } = useFormContext();

  return (
    <>
      <div data-field="extended_kv_cache.enabled"></div>
      {formKey === deployFormKeyMap.catalog && (
        <Form.Item name="mode">
          <SealSelect
            description={<TooltipList list={flavorTipsList}></TooltipList>}
            label="Mode"
            options={[
              { label: 'Throughput', value: 'throughput' },
              { label: 'Latency', value: 'latency' },
              { label: 'Reference', value: 'reference' }
            ]}
          ></SealSelect>
        </Form.Item>
      )}
      <KVCacheForm></KVCacheForm>
      <SpeculativeDecode></SpeculativeDecode>
    </>
  );
};

export default Performance;
