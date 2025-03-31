import SealInput from '@/components/seal-form/seal-input';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { modelSourceMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const HuggingFaceForm: React.FC = () => {
  const formCtx = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();
  const { isGGUF, byBuiltIn } = formCtx;
  const source = Form.useWatch('source');

  console.log('HuggingFaceForm', { source, isGGUF });

  if (
    ![
      modelSourceMap.huggingface_value,
      modelSourceMap.modelscope_value
    ].includes(source) ||
    byBuiltIn
  ) {
    return null;
  }
  return (
    <>
      <Form.Item<FormData>
        name="repo_id"
        key="repo_id"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'models.form.repoid')
          }
        ]}
      >
        <SealInput.Input
          label={intl.formatMessage({ id: 'models.form.repoid' })}
          required
          disabled={true}
        ></SealInput.Input>
      </Form.Item>
      {isGGUF && (
        <Form.Item<FormData>
          name="file_name"
          key="file_name"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'models.form.filename')
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'models.form.filename' })}
            required
            disabled={true}
          ></SealInput.Input>
        </Form.Item>
      )}
    </>
  );
};

export default HuggingFaceForm;
