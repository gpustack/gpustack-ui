import IconFont from '@/components/icon-font';
import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import YamlEditor from '@/pages/_components/yaml-editor';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import APIKeys from './api-keys';
import ProxyConfig from './proxy-config';

const referLinkZh = `https://higress.cn/docs/latest/plugins/ai/api-provider/ai-proxy/?spm=36971b57.3562eb7c.0.0.31764f5f7uLs2F#%E6%8F%90%E4%BE%9B%E5%95%86%E7%89%B9%E6%9C%89%E9%85%8D%E7%BD%AE`;
const referLinkEn = `https://higress.cn/en/docs/latest/plugins/ai/api-provider/ai-proxy/?spm=36971b57.4a688c53.0.0.64ac436ewz1xGA`;

const AdvanceConfig: React.FC<{
  action: PageActionType;
  ref?: any;
}> = forwardRef(({ action }, ref) => {
  const form = Form.useFormInstance();
  const intl = useIntl();
  const editorRef = React.useRef<any>(null);
  const [fileContent, setFileContent] = React.useState<string>('');

  const referLink = intl.locale === 'zh-CN' ? referLinkZh : referLinkEn;

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
      <APIKeys></APIKeys>
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
        title={
          <span className="flex-center">
            <span>{`${intl.formatMessage({ id: 'providers.form.customConfig' })} YAML`}</span>
            <Button size="small" type="link" target="_blank" href={referLink}>
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
      ></YamlEditor>
    </>
  );
});

export default AdvanceConfig;
