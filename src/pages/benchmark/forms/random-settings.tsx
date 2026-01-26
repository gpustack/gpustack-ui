import SealInputNumber from '@/components/seal-form/input-number';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { FormData } from '../config/types';

const DatasetForm: React.FC<{
  onValueChange?: (value: any) => void;
}> = ({ onValueChange }) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { getRuleMessage } = useAppUtils();

  return (
    <>
      <Form.Item<FormData>
        name="dataset_prompt_tokens"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'benchmark.table.inputTokenLength')
          }
        ]}
      >
        <SealInputNumber
          min={0}
          label={intl.formatMessage({ id: 'benchmark.table.inputTokenLength' })}
          required
          onChange={onValueChange}
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="dataset_output_tokens"
        rules={[
          {
            required: true,
            message: getRuleMessage(
              'input',
              'benchmark.table.outputTokenLength'
            )
          }
        ]}
      >
        <SealInputNumber
          min={0}
          label={intl.formatMessage({
            id: 'benchmark.table.outputTokenLength'
          })}
          required
          onChange={onValueChange}
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="seed"
        getValueProps={(value) => ({ value: value || null })}
      >
        <SealInputNumber
          min={0}
          label={intl.formatMessage({ id: 'playground.image.params.seed' })}
        ></SealInputNumber>
      </Form.Item>
    </>
  );
};

export default DatasetForm;
