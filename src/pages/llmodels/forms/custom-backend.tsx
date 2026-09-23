import {
  Input as CInput,
  Textarea as SealTextArea,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';

interface CustomBackendProps {
  /**
   * Renders the same fields at a nested Form path (e.g. `['roles', 0]`).
   * Absent means the model-level path, byte-for-byte what it was.
   */
  namePrefix?: (string | number)[];
}

const CustomBackend: React.FC<CustomBackendProps> = ({ namePrefix }) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const path = (...field: (string | number)[]) =>
    namePrefix ? [...namePrefix, ...field] : field;
  const backend = Form.useWatch(path('backend'), form);
  const { onValuesChange } = useFormContext();

  // See backend.tsx: `getFieldsValue()` stays the whole store (a model-level
  // shape), and the changed-values argument is dropped under a prefix rather
  // than handing the consumer a role field under a model-level key.
  const notifyValuesChange = (changedValues: Record<string, any>) => {
    onValuesChange?.(namePrefix ? {} : changedValues, form.getFieldsValue());
  };

  const handleImageNameOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const runCommand = form.getFieldValue(path('run_command'));
    if (value && runCommand) {
      notifyValuesChange({ image_name: value });
    }
  };

  const handleRunCommandOnBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const imageName = form.getFieldValue(path('image_name'));
    if (value && imageName) {
      notifyValuesChange({ run_command: value });
    }
  };

  return (
    <>
      {backend === backendOptionsMap.custom && (
        <>
          <Form.Item<FormData>
            name={path('image_name')}
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'backend.imageName')
              }
            ]}
          >
            <CInput.Input
              required
              allowClear
              onBlur={handleImageNameOnBlur}
              label={intl.formatMessage({ id: 'backend.imageName' })}
            ></CInput.Input>
          </Form.Item>
          <Form.Item<FormData>
            name={path('run_command')}
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
                    '{{model_path}} --port {{port}} --host {{worker_ip}} --served-model-name {{model_name}}'
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
