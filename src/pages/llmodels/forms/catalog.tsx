import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { Form } from 'antd';
import React from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const CatalogForm: React.FC = () => {
  const formCtx = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const {
    isGGUF,
    byBuiltIn,
    sizeOptions,
    quantizationOptions,
    onSizeChange,
    onQuantizationChange
  } = formCtx;
  const source = Form.useWatch('source');

  console.log('HuggingFaceForm', { source, isGGUF });

  if (!byBuiltIn && !sizeOptions?.length && !quantizationOptions?.length) {
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
      {sizeOptions && sizeOptions?.length > 0 && (
        <Form.Item<FormData>
          name="size"
          key="size"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'size', false)
            }
          ]}
        >
          <SealSelect
            filterOption
            onChange={handleSizeChange}
            defaultActiveFirstOption
            disabled={false}
            options={sizeOptions}
            label="Size"
            required
          ></SealSelect>
        </Form.Item>
      )}
      {quantizationOptions && quantizationOptions?.length > 0 && (
        <Form.Item<FormData>
          name="quantization"
          key="quantization"
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'quantization', false)
            }
          ]}
        >
          <SealSelect
            filterOption
            defaultActiveFirstOption
            disabled={false}
            options={quantizationOptions}
            onChange={handleOnQuantizationChange}
            label="Quantization"
            required
          ></SealSelect>
        </Form.Item>
      )}
    </>
  );
};

export default CatalogForm;
