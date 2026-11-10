import {
  Input as CInput,
  Textarea as SealTextArea,
  TextAttribute,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';
import RouterCommandHelp from './router-command-help';
import useRouterCommandHelp from './use-router-command-help';

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
  const routerCommand = useRouterCommandHelp(namePrefix);
  const path = (...field: (string | number)[]) =>
    namePrefix ? [...namePrefix, ...field] : field;
  const ownBackend = Form.useWatch(path('backend'), { form, preserve: true });
  const ownImage = Form.useWatch(path('image_name'), { form, preserve: true });
  const ownCommand = Form.useWatch(path('run_command'), {
    form,
    preserve: true
  });
  const parentBackend = Form.useWatch('backend', { form, preserve: true });
  const parentImage = Form.useWatch('image_name', { form, preserve: true });
  const parentCommand = Form.useWatch('run_command', { form, preserve: true });
  const commandRequired = routerCommand ? routerCommand.required : true;
  const inheritedCommand = routerCommand ? undefined : parentCommand;
  const legacyOverride =
    !!namePrefix &&
    ownBackend == null &&
    !!(ownImage || ownCommand) &&
    parentBackend === backendOptionsMap.custom;
  const backend = legacyOverride ? parentBackend : ownBackend;
  const { onValuesChange } = useFormContext();

  // See backend.tsx: `getFieldsValue()` stays the whole store (a model-level
  // shape), and the changed-values argument is dropped under a prefix rather
  // than handing the consumer a role field under a model-level key.
  const notifyValuesChange = (changedValues: Record<string, any>) => {
    onValuesChange?.(namePrefix ? {} : changedValues, form.getFieldsValue());
  };

  const handleImageNameOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const runCommand =
      form.getFieldValue(path('run_command')) ??
      (legacyOverride ? inheritedCommand : null);
    if (value && runCommand) {
      notifyValuesChange({ image_name: value });
    }
  };

  const handleRunCommandOnBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const imageName =
      form.getFieldValue(path('image_name')) ??
      (legacyOverride ? parentImage : null);
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
            preserve={namePrefix ? true : undefined}
            getValueProps={
              legacyOverride
                ? (value) => ({ value: value ?? parentImage })
                : undefined
            }
            rules={[
              {
                required: true,
                transform: (value) =>
                  value ?? (legacyOverride ? parentImage : value),
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
            extra={
              routerCommand ? (
                <RouterCommandHelp mode={routerCommand.mode} />
              ) : undefined
            }
            preserve={namePrefix ? true : undefined}
            getValueProps={
              legacyOverride
                ? (value) => ({ value: value ?? inheritedCommand })
                : undefined
            }
            rules={[
              {
                required: commandRequired,
                transform: (value) =>
                  value ?? (legacyOverride ? inheritedCommand : value),
                message: getRuleMessage('input', 'backend.runCommand')
              }
            ]}
          >
            <SealTextArea
              allowClear
              required={commandRequired}
              scaleSize={false}
              alwaysFocus={true}
              autoSize={{ minRows: 2, maxRows: 5 }}
              onBlur={handleRunCommandOnBlur}
              label={intl.formatMessage({ id: 'backend.runCommand' })}
              labelExtra={
                !commandRequired ? (
                  <TextAttribute className="m-l-4">
                    {intl.formatMessage({ id: 'common.form.field.optional' })}
                  </TextAttribute>
                ) : undefined
              }
              description={intl.formatMessage({
                id: routerCommand
                  ? `models.form.roles.router.command.${routerCommand.managed ? 'managed' : 'custom'}.tips`
                  : 'backend.form.defaultExecuteCommand.tips'
              })}
              placeholder={
                routerCommand
                  ? intl.formatMessage({
                      id: `models.form.roles.router.command.${routerCommand.managed ? 'auto' : 'custom'}.placeholder`
                    })
                  : intl.formatMessage(
                      { id: 'common.help.eg' },
                      {
                        content:
                          '{{model_path}} --port {{port}} --host {{worker_ip}} --served-model-name {{model_name}}'
                      }
                    )
              }
            ></SealTextArea>
          </Form.Item>
        </>
      )}
    </>
  );
};

export default CustomBackend;
