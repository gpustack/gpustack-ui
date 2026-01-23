import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInput from '@/components/seal-form/seal-input';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { useFormContext } from '../config/form-context';

const AdvanceConfig = () => {
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const intl = useIntl();
  const { action } = useFormContext();
  const proxyConfigRef = React.useRef<any>({});
  const proxyConfigEnabled = Form.useWatch('proxy_enabled', form);

  const handleProxyEnabledChange = (e: any) => {
    if (e.target.checked) {
      form.setFieldsValue({
        proxy_enabled: true,
        proxy_url: proxyConfigRef.current.proxy_url || '',
        proxy_timeout: proxyConfigRef.current.proxy_timeout || 30
      });
    } else {
      proxyConfigRef.current = form.getFieldsValue([
        'proxy_url',
        'proxy_timeout'
      ]);
      form.setFieldsValue({
        proxy_enabled: false,
        proxy_url: '',
        proxy_timeout: 30
      });
    }
  };

  return (
    <>
      <Form.Item
        name="proxy_enabled"
        valuePropName="checked"
        style={{ marginBottom: 8 }}
      >
        <CheckboxField
          label={intl.formatMessage({ id: 'providers.form.proxy.enable' })}
          onChange={handleProxyEnabledChange}
        ></CheckboxField>
      </Form.Item>
      {proxyConfigEnabled && (
        <>
          <Form.Item
            name="proxy_url"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  intl.formatMessage({ id: 'providers.form.proxy.url' })
                )
              }
            ]}
          >
            <SealInput.Input
              required
              label={intl.formatMessage({ id: 'providers.form.proxy.url' })}
              placeholder="http://proxy.example.com:8080"
            ></SealInput.Input>
          </Form.Item>
          <Form.Item name="proxy_timeout">
            <SealInput.Number
              label={intl.formatMessage({ id: 'providers.form.proxy.timeout' })}
              placeholder="30"
            ></SealInput.Number>
          </Form.Item>
        </>
      )}
    </>
  );
};

export default AdvanceConfig;
