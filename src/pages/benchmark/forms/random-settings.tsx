import SealInputNumber from '@/components/seal-form/input-number';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { FormData } from '../config/types';

const RandomSettingsForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const profile = Form.useWatch('profile', form);
  const { getRuleMessage } = useAppUtils();

  const disabled = profile !== 'Custom' && Boolean(profile);

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
          disabled={disabled}
          label={intl.formatMessage({ id: 'benchmark.table.inputTokenLength' })}
          required
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
          disabled={disabled}
          label={intl.formatMessage({
            id: 'benchmark.table.outputTokenLength'
          })}
          required
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="seed"
        getValueProps={(value) => ({ value: value || null })}
      >
        <SealInputNumber
          min={0}
          disabled={disabled}
          label={intl.formatMessage({ id: 'playground.image.params.seed' })}
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="request_rate"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'benchmark.table.requestRate')
          }
        ]}
      >
        <SealInputNumber
          min={0}
          disabled={disabled}
          label={intl.formatMessage({ id: 'benchmark.table.requestRate' })}
          required
        ></SealInputNumber>
      </Form.Item>
      <Form.Item<FormData>
        name="total_requests"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'benchmark.form.totalRequests')
          }
        ]}
      >
        <SealInputNumber
          min={0}
          disabled={disabled}
          label={intl.formatMessage({ id: 'benchmark.form.totalRequests' })}
          required
        ></SealInputNumber>
      </Form.Item>
    </>
  );
};

export default RandomSettingsForm;
