import SealInputNumber from '@/components/seal-form/input-number';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { FormData } from '../config/types';

const DatasetForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();

  return (
    <>
      <Form.Item<FormData>
        name="input_length"
        rules={[
          {
            required: true,
            message: getRuleMessage(
              'select',
              'benchmark.table.inputTokenLength'
            )
          }
        ]}
      >
        <SealSelect
          options={[]}
          label={intl.formatMessage({ id: 'benchmark.table.inputTokenLength' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="output_length"
        rules={[
          {
            required: true,
            message: getRuleMessage(
              'select',
              'benchmark.table.outputTokenLength'
            )
          }
        ]}
      >
        <SealSelect
          options={[]}
          label={intl.formatMessage({
            id: 'benchmark.table.outputTokenLength'
          })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData> name="seed">
        <SealInputNumber
          label={intl.formatMessage({ id: 'playground.image.params.seed' })}
          required
        ></SealInputNumber>
      </Form.Item>
    </>
  );
};

export default DatasetForm;
