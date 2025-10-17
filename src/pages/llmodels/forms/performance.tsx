import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { deployFormKeyMap } from '../config';
import { useFormContext } from '../config/form-context';
import KVCacheForm from './kv-cache';
import SpeculativeDecode from './speculative-decode';

const modeTipsList = [
  {
    title: {
      text: 'models.form.mode.throughput',
      locale: true
    },
    tips: 'models.form.mode.throughput.tips'
  },
  {
    title: {
      text: 'models.form.mode.latency',
      locale: true
    },
    tips: 'models.form.mode.latency.tips'
  },
  {
    title: {
      text: 'models.form.mode.reference',
      locale: true
    },
    tips: 'models.form.mode.reference.tips'
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
            description={<TooltipList list={modeTipsList}></TooltipList>}
            label={intl.formatMessage({ id: 'models.form.mode' })}
            options={[
              {
                label: intl.formatMessage({
                  id: 'models.form.mode.throughput'
                }),
                value: 'throughput'
              },
              {
                label: intl.formatMessage({ id: 'models.form.mode.latency' }),
                value: 'latency'
              },
              {
                label: intl.formatMessage({ id: 'models.form.mode.reference' }),
                value: 'reference'
              }
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
