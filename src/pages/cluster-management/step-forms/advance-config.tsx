import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useUserSettings from '@/hooks/use-user-settings';
import { json2Yaml } from '@/pages/backends/config';
import { Input as CInput, IconFont } from '@gpustack/core-ui';
import { YamlEditor } from '@gpustack/core-ui/yaml-editor';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import styled from 'styled-components';
import DefaultRegistryField from '../components/default-registry-field';
import {
  GpuServiceSettingsForm,
  OperatorImageForm
} from '../components/k8s-pod-spec';
import { ProviderType, ProviderValueMap } from '../config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import dockerSchema from '../config/worker-config.docker.json';
import kubernetesSchema from '../config/worker-config.kubernetes.json';
import { dockerConfig, kubernetesConfig } from '../config/yaml-template';

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  font-size: 14px;
  padding-top: 0px;
  height: 56px;
  padding-bottom: 8px;
`;

const ClusterAdvanceConfig: React.FC<{
  action: PageActionType;
  provider: ProviderType;
  currentData?: ListItem;
  ref?: any;
}> = forwardRef(({ action, provider, currentData }, ref) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const editorRef = React.useRef<any>(null);
  const { isDarkTheme } = useUserSettings();
  const [fileContent, setFileContent] = React.useState<string>('');
  const schema =
    provider === ProviderValueMap.Kubernetes ? kubernetesSchema : dockerSchema;

  useImperativeHandle(ref, () => ({
    getYamlValue: () => {
      return editorRef.current?.getValue();
    },
    setYamlValue: (values: any) => {
      editorRef.current?.setValue(
        values ||
          (provider === ProviderValueMap.Kubernetes
            ? kubernetesConfig
            : dockerConfig)
      );
    }
  }));

  useEffect(() => {
    const template =
      provider === ProviderValueMap.Kubernetes
        ? kubernetesConfig
        : dockerConfig;
    if (action === PageAction.CREATE) {
      setFileContent(template);
    } else if (action === PageAction.EDIT) {
      // `worker_config` is an object on the wire — monaco's `createModel`
      // only accepts a string, so serialize it the same way ClusterForm does
      // before it reaches the editor.
      const workerConfig = currentData?.worker_config;
      setFileContent(
        workerConfig && Object.keys(workerConfig).length > 0
          ? json2Yaml(workerConfig)
          : template
      );
    }
  }, [provider, action, currentData?.worker_config]);

  return (
    <>
      <Form.Item<FormData>
        hidden
        name="worker_config"
        rules={[
          {
            required: false,
            message: ''
          }
        ]}
      >
        <CInput.TextArea required={false} trim={false}></CInput.TextArea>
      </Form.Item>
      {/* Shuihua renders this field in the basic form instead, where it is
          mandatory — see `components/default-registry-field`. */}
      {provider !== ProviderValueMap.Shuihua && (
        <DefaultRegistryField provider={provider} />
      )}
      {provider === ProviderValueMap.Kubernetes && (
        <>
          <OperatorImageForm />
          <GpuServiceSettingsForm />
        </>
      )}
      <Title>
        {intl.formatMessage({ id: 'clusters.create.workerConfig' })}
      </Title>
      <YamlEditor
        ref={editorRef}
        isDarkTheme={isDarkTheme}
        title={
          <span className="flex-center">
            <span>{`YAML`}</span>
            <Button
              size="small"
              type="link"
              target="_blank"
              href="https://docs.gpustack.ai/latest/cli-reference/start/#config-file"
            >
              {intl.formatMessage({ id: 'playground.audio.enablemic.doc' })}{' '}
              <IconFont
                type="icon-external-link"
                className="font-size-14"
              ></IconFont>
            </Button>
          </span>
        }
        value={fileContent}
        height={300}
        onUpload={(content) => {
          setFileContent(content);
        }}
        schema={schema}
      ></YamlEditor>
      <div className="scroller-to-holder" style={{ height: 1 }}></div>
    </>
  );
});

export default ClusterAdvanceConfig;
