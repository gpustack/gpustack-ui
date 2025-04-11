import SealAutoComplete from '@/components/seal-form/auto-complete';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { modelSourceMap, ollamaModelOptions } from '../config';
import { useFormContext, useFormInnerContext } from '../config/form-context';
import { FormData } from '../config/types';

const OllamaForm: React.FC = () => {
  const formCtx = useFormContext();
  const formInnerCtx = useFormInnerContext();
  const { byBuiltIn, onValuesChange } = formCtx;
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();
  const source = Form.useWatch('source');
  const formInstance = Form.useFormInstance();

  if (![modelSourceMap.ollama_library_value].includes(source) || byBuiltIn) {
    return null;
  }
  const handleModelNameChange = (value: string) => {
    if (value) {
      onValuesChange?.({}, formInstance.getFieldsValue());
    }
  };

  const handleOnBlur = (e: any) => {
    onValuesChange?.({}, formInstance.getFieldsValue());
  };
  return (
    <>
      <Form.Item<FormData>
        name="ollama_library_model_name"
        key="ollama_library_model_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'models.table.name')
          }
        ]}
      >
        <SealAutoComplete
          allowClear
          filterOption
          defaultActiveFirstOption
          disabled={false}
          options={ollamaModelOptions}
          onSelect={handleModelNameChange}
          onBlur={handleOnBlur}
          description={
            <span
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({ id: 'models.form.ollamalink' })
              }}
            ></span>
          }
          label={intl.formatMessage({ id: 'model.form.ollama.model' })}
          placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
          required
        ></SealAutoComplete>
      </Form.Item>
    </>
  );
};

export default OllamaForm;
