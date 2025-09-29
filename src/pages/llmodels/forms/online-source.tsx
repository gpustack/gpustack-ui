import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { Form } from 'antd';
import React from 'react';
import { deployFormKeyMap, modelSourceMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const HuggingFaceForm: React.FC = () => {
  const formInstance = Form.useFormInstance();
  const formCtx = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const { formKey, pageAction, onValuesChange } = formCtx;
  const source = Form.useWatch('source');

  if (
    ![
      modelSourceMap.huggingface_value,
      modelSourceMap.modelscope_value
    ].includes(source) ||
    formKey === deployFormKeyMap.catalog
  ) {
    return null;
  }

  const handleOnBlur = (e: any) => {
    onValuesChange?.({}, formInstance.getFieldsValue());
  };

  return (
    <>
      {source === modelSourceMap.huggingface_value ? (
        <>
          <Form.Item<FormData>
            name="huggingface_repo_id"
            key="huggingface_repo_id"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'models.form.repoid')
              }
            ]}
          >
            <SealInput.Input
              label="Base Model"
              required
              disabled={pageAction === PageAction.CREATE}
              onBlur={handleOnBlur}
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<FormData>
            hidden
            name="huggingface_filename"
            key="huggingface_filename"
          >
            <SealInput.Input
              disabled={pageAction === PageAction.CREATE}
            ></SealInput.Input>
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item<FormData>
            name="model_scope_model_id"
            key="model_scope_model_id"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'models.form.repoid')
              }
            ]}
          >
            <SealInput.Input
              label="Base Model"
              required
              disabled={pageAction === PageAction.CREATE}
              onBlur={handleOnBlur}
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<FormData>
            hidden
            name="model_scope_file_path"
            key="model_scope_file_path"
          >
            <SealInput.Input
              disabled={pageAction === PageAction.CREATE}
            ></SealInput.Input>
          </Form.Item>
        </>
      )}
    </>
  );
};

export default HuggingFaceForm;
