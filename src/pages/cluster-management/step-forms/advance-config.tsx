import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useUserSettings from '@/hooks/use-user-settings';
import { Input as CInput, IconFont } from '@gpustack/core-ui';
import { YamlEditor } from '@gpustack/core-ui/yaml-editor';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import styled from 'styled-components';
import {
  GpuInstancesStaticAddressForm,
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
    if (action === PageAction.CREATE) {
      setFileContent(
        provider === ProviderValueMap.Kubernetes
          ? kubernetesConfig
          : dockerConfig
      );
    } else if (action === PageAction.EDIT) {
      const workerConfig = currentData?.worker_config;
      const content =
        workerConfig ||
        (provider === ProviderValueMap.Kubernetes
          ? kubernetesConfig
          : dockerConfig);
      setFileContent(content as string);
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
      {/* Default container registry used to resolve images for this cluster.
          A top-level cluster field shared by both Docker and Kubernetes
          providers (the backend hoists any legacy worker_config value onto
          this column). */}
      <Form.Item<FormData>
        name="system_default_container_registry"
        normalize={(value) => value?.trim?.() || null}
      >
        <CInput.Input
          label={intl.formatMessage({
            id: 'clusters.systemDefaultContainerRegistry.title'
          })}
          description={intl.formatMessage({
            id: 'clusters.systemDefaultContainerRegistry.tip'
          })}
          placeholder="docker.io"
        ></CInput.Input>
      </Form.Item>
      {provider === ProviderValueMap.Kubernetes && (
        <>
          <OperatorImageForm />
          <GpuInstancesStaticAddressForm />
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
