import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import YamlEditor from '@/pages/_components/yaml-editor';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import { maasProviderType } from '../config';

const AdvanceConfig: React.FC<{
  action: PageActionType;
  provider?: maasProviderType;
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
      console.log('setYamlValue:', values);
      editorRef.current?.setValue(values || '');
    }
  }));

  return (
    <>
      <div data-field="customConfig"></div>
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
        title={'Yaml'}
        value={fileContent}
        height={300}
        onUpload={(content) => {
          setFileContent(content);
        }}
      ></YamlEditor>
      <div className="scroller-to-holder" style={{ height: 1 }}></div>
    </>
  );
});

export default AdvanceConfig;
