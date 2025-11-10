import SealInput from '@/components/seal-form/seal-input';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { DeployFormKeyMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

/**
 * It can access some props from CatalogFormContext
 */
const CatalogForm: React.FC = () => {
  const intl = useIntl();
  const formCtx = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const { formKey } = formCtx;

  if (formKey !== DeployFormKeyMap.CATALOG) {
    return null;
  }

  return (
    <>
      <Form.Item<FormData>
        name="quantization"
        key="quantization"
        rules={[
          {
            required: false,
            message: getRuleMessage('select', 'models.catalog.precision', false)
          }
        ]}
      >
        <SealInput.Input
          label={intl.formatMessage({ id: 'models.catalog.precision' })}
          disabled
        ></SealInput.Input>
      </Form.Item>
    </>
  );
};

export default CatalogForm;
