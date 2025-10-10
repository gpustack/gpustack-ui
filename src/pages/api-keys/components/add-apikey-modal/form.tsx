import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { expirationOptions } from '../../config';
import { FormData } from '../../config/types';
import AllowModelsForm from './allow-models';

const APIKeyForm: React.FC = () => {
  const intl = useIntl();

  return (
    <>
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
      <Form.Item<FormData>
        name="expires_in"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              { id: 'common.form.rule.select' },
              {
                name: intl.formatMessage({
                  id: 'apikeys.form.expiretime'
                })
              }
            )
          }
        ]}
      >
        <SealSelect
          options={expirationOptions}
          label={intl.formatMessage({ id: 'apikeys.form.expiretime' })}
          required
        ></SealSelect>
      </Form.Item>
      <AllowModelsForm></AllowModelsForm>
      <Form.Item<FormData> name="description" rules={[{ required: false }]}>
        <SealInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({ id: 'common.table.description' })}
        ></SealInput.TextArea>
      </Form.Item>
    </>
  );
};

export default APIKeyForm;
