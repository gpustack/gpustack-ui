import { Input as CInput, useAppUtils } from '@gpustack/core-ui';
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
        <CInput.Input
          label={intl.formatMessage({ id: 'models.catalog.precision' })}
          disabled
        ></CInput.Input>
      </Form.Item>
    </>
  );
};

export default CatalogForm;
