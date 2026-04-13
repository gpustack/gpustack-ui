import { PageAction } from '@/config';
import {
  Input as CInput,
  LabelSelector,
  ListInput,
  Textarea as SealTextArea,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useEffect } from 'react';
import { BackendSourceValueMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const BasicForm = () => {
  const form = Form.useFormInstance();
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const { action, backendSource } = useFormContext();
  const defaultEnvs = Form.useWatch('default_env', form);

  const handleEnviromentVarsChange = (labels: Record<string, any>) => {
    form.setFieldValue('default_env', labels);
  };

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
      <Form.Item<FormData>
        name="default_backend_param"
        rules={[{ required: false }]}
      >
        <ListInput
          dataList={form.getFieldValue('default_backend_param') || []}
          onChange={(data: string[]) => {
            form.setFieldValue('default_backend_param', data);
          }}
          btnText={intl.formatMessage({ id: 'backend.form.addParameter' })}
          label={intl.formatMessage({
            id: 'backend.form.defaultBackendParameters'
          })}
        ></ListInput>
      </Form.Item>
      <Form.Item<FormData> name="default_env">
        <LabelSelector
          label={intl.formatMessage({
            id: 'backend.form.defaultEnvironment'
          })}
          labels={defaultEnvs}
          btnText={intl.formatMessage({ id: 'common.button.vars' })}
          onChange={handleEnviromentVarsChange}
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
