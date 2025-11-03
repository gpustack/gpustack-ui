import SealInput from '@/components/seal-form/seal-input';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { DeployFormKeyMap } from '../config';
import { useCatalogFormContext, useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const CatalogForm: React.FC = () => {
  const intl = useIntl();
  const formCtx = useFormContext();
  const catalogFormCtx = useCatalogFormContext();
  const { getRuleMessage } = useAppUtils();
  const { formKey } = formCtx;
  const {
    sizeOptions,
    quantizationOptions,
    onSizeChange,
    onQuantizationChange
  } = catalogFormCtx;

  if (formKey !== DeployFormKeyMap.CATALOG) {
    return null;
  }

  const handleSizeChange = (val: any) => {
    onSizeChange?.(val);
  };

  const handleOnQuantizationChange = (val: any) => {
    onQuantizationChange?.(val);
  };
  return (
    <>
      <Form.Item<FormData>
        name="quantization"
        key="quantization"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'models.form.quantization', false)
          }
        ]}
      >
        <SealInput.Input
          label={intl.formatMessage({ id: 'models.form.quantization' })}
          disabled
        ></SealInput.Input>
      </Form.Item>
    </>
  );
};

export default CatalogForm;
