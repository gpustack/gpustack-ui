import PluginExtraFields from '@/components/plugin-extra-fields';
import { PageAction } from '@/config';
import { backendOptionsMap } from '@/pages/llmodels/constants/backend-parameters';
import {
  Input as CInput,
  LabelSelector,
  ListInput,
  Select as SealSelect,
  Textarea as SealTextArea,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useEffect } from 'react';
import { BackendSourceValueMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import formStyles from '../styles/form.less';

const defaultCommand = {
  [backendOptionsMap.SGLang]: {
    defaultEntry: 'sglang serve',
    defaultCommand:
      '--model-path {{model_path}} --host {{worker_ip}} --port {{port}}'
  },
  [backendOptionsMap.vllm]: {
    defaultEntry: 'vllm serve',
    defaultCommand:
      '{{model_path}} --host {{worker_ip}} --port {{port}} --served-model-name {{model_name}}'
  }
};

const BasicForm = () => {
  const form = Form.useFormInstance();
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const { action, backendSource } = useFormContext();
  const backendName = Form.useWatch('backend_name', form);

  const showBuiltinPreset =
    action === PageAction.EDIT &&
    backendSource === BackendSourceValueMap.BUILTIN &&
    !!defaultCommand[backendName];

  useEffect(() => {
    if (action === PageAction.CREATE) {
      form.setFieldValue('backend_source', BackendSourceValueMap.CUSTOM);
    }
  }, [action]);

  return (
    <>
      <Form.Item<FormData>
        name="backend_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          }
        ]}
      >
        <CInput.Input
          trim
          addAfter={
            backendSource === BackendSourceValueMap.CUSTOM ? '-custom' : null
          }
          disabled={action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'common.table.name' })}
          required
        ></CInput.Input>
      </Form.Item>
      <PluginExtraFields
        name="CreateOrgScopeField"
        context={{ action, allowGlobal: true }}
      />
      <Form.Item<FormData> hidden name="backend_source">
        <CInput.Input></CInput.Input>
      </Form.Item>
      {backendSource !== BackendSourceValueMap.BUILTIN && (
        <>
          <Form.Item<FormData>
            name="health_check_path"
            rules={[{ required: false }]}
          >
            <CInput.Input
              trim
              placeholder={`/v1/models`}
              label={intl.formatMessage({ id: 'backend.form.healthCheckPath' })}
            ></CInput.Input>
          </Form.Item>
          <Form.Item name="default_run_command">
            <SealTextArea
              scaleSize={false}
              alwaysFocus={true}
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
              autoSize={{ minRows: 2, maxRows: 5 }}
              label={intl.formatMessage({
                id: 'backend.form.defaultExecuteCommand'
              })}
            ></SealTextArea>
          </Form.Item>
        </>
      )}
      {showBuiltinPreset && (
        <div className={formStyles.command}>
          <Form.Item>
            <CInput.Input
              disabled
              value={defaultCommand[backendName].defaultEntry}
              label={intl.formatMessage({
                id: 'backend.form.defaultEntrypoint'
              })}
            ></CInput.Input>
          </Form.Item>
          <Form.Item>
            <SealTextArea
              scaleSize={false}
              disabled
              value={defaultCommand[backendName].defaultCommand}
              autoSize={{ minRows: 2, maxRows: 5 }}
              label={
                <span style={{ backgroundColor: 'transparent' }}>
                  {intl.formatMessage({
                    id: 'backend.form.defaultExecuteCommand'
                  })}
                </span>
              }
            ></SealTextArea>
          </Form.Item>
        </div>
      )}
      <Form.Item<FormData>
        name="default_backend_param"
        rules={[{ required: false }]}
      >
        <ListInput
          btnText={intl.formatMessage({ id: 'backend.form.addParameter' })}
          label={intl.formatMessage({
            id: 'backend.form.defaultBackendParameters'
          })}
        ></ListInput>
      </Form.Item>
      <Form.Item<FormData>
        name="parameter_format"
        initialValue="auto"
        rules={[{ required: false }]}
      >
        <SealSelect
          label={intl.formatMessage({ id: 'backend.form.parameterFormat' })}
          options={[
            {
              label: intl.formatMessage({
                id: 'backend.form.parameterFormat.default'
              }),
              value: 'auto'
            },
            {
              label: intl.formatMessage({
                id: 'backend.form.parameterFormat.space'
              }),
              value: 'space'
            },
            {
              label: intl.formatMessage({
                id: 'backend.form.parameterFormat.equal'
              }),
              value: 'equal'
            }
          ]}
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="common_parameters"
        rules={[{ required: false }]}
      >
        <ListInput
          description={intl.formatMessage({
            id: 'backend.form.commonParameters.tips'
          })}
          btnText={intl.formatMessage({ id: 'backend.form.addParameter' })}
          label={intl.formatMessage({
            id: 'backend.form.commonParameters'
          })}
        ></ListInput>
      </Form.Item>
      <Form.Item<FormData> name="default_env">
        <LabelSelector
          label={intl.formatMessage({
            id: 'backend.form.defaultEnvironment'
          })}
          btnText={intl.formatMessage({ id: 'common.button.vars' })}
        ></LabelSelector>
      </Form.Item>

      <Form.Item<FormData> name="description" rules={[{ required: false }]}>
        <CInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({ id: 'common.table.description' })}
        ></CInput.TextArea>
      </Form.Item>
    </>
  );
};

export default BasicForm;
