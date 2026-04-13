import { PageAction } from '@/config';
import { Input as CInput, useAppUtils } from '@gpustack/core-ui';
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
            <CInput.Input
              label={intl.formatMessage({ id: 'models.form.repoid' })}
              required
              disabled={action === PageAction.CREATE}
              onBlur={handleOnBlur}
            ></CInput.Input>
          </Form.Item>
          {isGGUF && (
            <Form.Item<FormData>
              name="huggingface_filename"
              key="huggingface_filename"
            >
              <CInput.Input
                label={intl.formatMessage({ id: 'models.form.filename' })}
                disabled={action === PageAction.CREATE}
              ></CInput.Input>
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
            <CInput.Input
              required
              label={intl.formatMessage({ id: 'models.form.repoid' })}
              disabled={action === PageAction.CREATE}
              onBlur={handleOnBlur}
            ></CInput.Input>
          </Form.Item>
          {isGGUF && (
            <Form.Item<FormData>
              name="model_scope_file_path"
              key="model_scope_file_path"
            >
              <CInput.Input
                label={intl.formatMessage({ id: 'models.form.filename' })}
                disabled={action === PageAction.CREATE}
              ></CInput.Input>
            </Form.Item>
          )}
        </>
      )}
    </>
  );
};

export default HuggingFaceForm;
