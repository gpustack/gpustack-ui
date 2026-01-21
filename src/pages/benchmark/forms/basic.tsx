import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { FormData } from '../config/types';

const BasicForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();

  return (
    <Form.Item<FormData>
      name="name"
      rules={[
        {
          required: true,
          message: intl.formatMessage(
            { id: 'common.form.rule.input' },
            {
              name: intl.formatMessage({ id: 'common.table.name' })
            }
          )
        }
      ]}
    >
      <SealInput.Input
        label={intl.formatMessage({ id: 'common.table.name' })}
        required
      ></SealInput.Input>
    </Form.Item>
  );
};

export default BasicForm;
