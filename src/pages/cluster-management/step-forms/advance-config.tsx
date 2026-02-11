import IconFont from '@/components/icon-font';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import YamlEditor from '@/pages/_components/yaml-editor';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import { ClusterFormData as FormData } from '../config/types';
import schema from '../config/worker-config.json';
import { dockerConfig, kubernetesConfig } from '../config/yaml-template';

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
        <SealInput.TextArea required={false} trim={false}></SealInput.TextArea>
      </Form.Item>
      <YamlEditor
        ref={editorRef}
        title={
          <span className="flex-center">
            <span>{`${intl.formatMessage({ id: 'clusters.create.workerConfig' })} (YAML)`}</span>
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
