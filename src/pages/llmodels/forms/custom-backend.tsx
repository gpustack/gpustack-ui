import SealInput from '@/components/seal-form/seal-input';
import SealTextArea from '@/components/seal-form/seal-textarea';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const CustomBackend: React.FC = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const backend = Form.useWatch('backend', form);
  const { onValuesChange } = useFormContext();

  const handleImageNameOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const runCommand = form.getFieldValue('run_command');
    if (value && runCommand) {
      onValuesChange?.({ image_name: value }, form.getFieldsValue());
    }
  };

  const handleRunCommandOnBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const imageName = form.getFieldValue('image_name');
    if (value && imageName) {
      onValuesChange?.({ run_command: value }, form.getFieldsValue());
    }
  };

  return (
    <>
      {backend === backendOptionsMap.custom && (
        <>
          <Form.Item<FormData>
            name="image_name"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'backend.imageName')
              }
            ]}
          >
            <SealInput.Input
              required
              allowClear
              onBlur={handleImageNameOnBlur}
              label={intl.formatMessage({ id: 'backend.imageName' })}
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<FormData>
            name="run_command"
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'backend.runCommand')
              }
            ]}
          >
            <SealTextArea
              allowClear
              required
              scaleSize={false}
              alwaysFocus={true}
              autoSize={{ minRows: 2, maxRows: 5 }}
              onBlur={handleRunCommandOnBlur}
              label={intl.formatMessage({ id: 'backend.runCommand' })}
              description={intl.formatMessage({
                id: 'backend.form.defaultExecuteCommand.tips'
              })}
              placeholder={intl.formatMessage(
                { id: 'common.help.eg' },
                {
                  content:
                    'vllm serve {{model_path}} --port {{port}} --host {{worker_ip}} --served-model-name {{model_name}}'
                }
              )}
            ></SealTextArea>
          </Form.Item>
        </>
      )}
    </>
  );
};

export default CustomBackend;
