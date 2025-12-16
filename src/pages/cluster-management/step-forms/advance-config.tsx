import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import YamlEditor from '@/pages/_components/yaml-editor';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import { ClusterFormData as FormData } from '../config/types';
import schema from '../config/worker-config.json';
import yamlTemplate from '../config/yaml-template';

const ClusterAdvanceConfig: React.FC<{ action: PageActionType; ref?: any }> =
  forwardRef(({ action }, ref) => {
    const [form] = Form.useForm();
    const intl = useIntl();
    const editorRef = React.useRef<any>(null);
    const [fileContent, setFileContent] = React.useState<string>('');

    useImperativeHandle(ref, () => ({
      getYamlValue: () => {
        return editorRef.current?.getValue();
      },
      setYamlValue: (values: any) => {
        console.log('setYamlValue:', values, editorRef.current);
        editorRef.current?.setValue(values);
      }
    }));

    return (
      <>
        <Form.Item<FormData>
          name="server_url"
          rules={[
            {
              required: false,
              message: ''
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'clusters.create.serverUrl' })}
            required={false}
            trim={true}
          ></SealInput.Input>
        </Form.Item>
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
          <SealInput.TextArea
            required={false}
            trim={false}
          ></SealInput.TextArea>
        </Form.Item>
        <YamlEditor
          ref={editorRef}
          title={`${intl.formatMessage({ id: 'clusters.create.workerConfig' })} YAML`}
          value={fileContent}
          height={300}
          onUpload={(content) => {
            setFileContent(content);
          }}
          schema={schema}
          placeholder={yamlTemplate}
        ></YamlEditor>
      </>
    );
  });

export default ClusterAdvanceConfig;
