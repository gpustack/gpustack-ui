import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { DeployFormKeyMap, modelSourceMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const HuggingFaceForm: React.FC = () => {
  const intl = useIntl();
  const formInstance = Form.useFormInstance();
  const formCtx = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const { formKey, action, isGGUF, onValuesChange } = formCtx;
  const source = Form.useWatch('source');

  if (
    ![
      modelSourceMap.huggingface_value,
      modelSourceMap.modelscope_value
    ].includes(source) ||
    formKey === DeployFormKeyMap.CATALOG
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
              label={intl.formatMessage({ id: 'models.form.repoid' })}
              required
              disabled={action === PageAction.CREATE}
              onBlur={handleOnBlur}
            ></SealInput.Input>
          </Form.Item>
          {isGGUF && (
            <Form.Item<FormData>
              name="huggingface_filename"
              key="huggingface_filename"
            >
              <SealInput.Input
                label={intl.formatMessage({ id: 'models.form.filename' })}
                disabled={action === PageAction.CREATE}
              ></SealInput.Input>
            </Form.Item>
          )}
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
              required
              label={intl.formatMessage({ id: 'models.form.repoid' })}
              disabled={action === PageAction.CREATE}
              onBlur={handleOnBlur}
            ></SealInput.Input>
          </Form.Item>
          {isGGUF && (
            <Form.Item<FormData>
              name="model_scope_file_path"
              key="model_scope_file_path"
            >
              <SealInput.Input
                label={intl.formatMessage({ id: 'models.form.filename' })}
                disabled={action === PageAction.CREATE}
              ></SealInput.Input>
            </Form.Item>
          )}
        </>
      )}
    </>
  );
};

export default HuggingFaceForm;
