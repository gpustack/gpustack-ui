import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import YamlEditor from '@/pages/_components/yaml-editor';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import AccessToken from './access-token';
import ProxyConfig from './proxy-config';

const AdvanceConfig: React.FC<{
  action: PageActionType;
  ref?: any;
}> = forwardRef(({ action }, ref) => {
  const form = Form.useFormInstance();
  const intl = useIntl();
  const editorRef = React.useRef<any>(null);
  const [fileContent, setFileContent] = React.useState<string>('');

  useImperativeHandle(ref, () => ({
    getYamlValue: () => {
      return editorRef.current?.getValue();
    },
    setYamlValue: (values: any) => {
      console.log('setYamlValue:', values);
      editorRef.current?.setValue(values || '');
    }
  }));

  return (
    <>
      <div data-field="advanceConfig"></div>
      <AccessToken></AccessToken>
      <ProxyConfig></ProxyConfig>
      <Form.Item
        hidden
        name="custom_config"
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
        title={`${intl.formatMessage({ id: 'providers.form.customConfig' })} (YAML)`}
        value={fileContent}
        height={300}
        onUpload={(content) => {
          setFileContent(content);
        }}
      ></YamlEditor>
    </>
  );
});

export default AdvanceConfig;
