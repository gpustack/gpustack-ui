import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Input as CInput, IconFont, YamlEditor } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import styled from 'styled-components';
import K8SVolumeMount from '../components/k8s-volume-mount';
import { ProviderType, ProviderValueMap } from '../config';
import { ClusterFormData as FormData } from '../config/types';
import schema from '../config/worker-config.json';
import { dockerConfig, kubernetesConfig } from '../config/yaml-template';

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--ant-color-bg-container);
  font-weight: 500;
  font-size: 14px;
  padding-top: 0px;
  height: 56px;
  padding-bottom: 8px;
`;

const ClusterAdvanceConfig: React.FC<{
  action: PageActionType;
  provider: ProviderType;
  ref?: any;
}> = forwardRef(({ action, provider }, ref) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const editorRef = React.useRef<any>(null);
  const [fileContent, setFileContent] = React.useState<string>('');

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
    }
  }, [provider, action]);

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
      {provider === ProviderValueMap.Kubernetes && (
        <K8SVolumeMount action={action}></K8SVolumeMount>
      )}
      <Title>
        {intl.formatMessage({ id: 'clusters.create.workerConfig' })}
      </Title>
      <YamlEditor
        ref={editorRef}
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
