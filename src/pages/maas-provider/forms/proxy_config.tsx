import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { useFormContext } from '../config/form-context';

const AdvanceConfig = () => {
  const form = Form.useFormInstance();
  const intl = useIntl();
  const { action } = useFormContext();
  const proxyConfigRef = React.useRef<any>({});
  const proxyConfigEnabled = Form.useWatch(['proxy_config', 'enabled'], form);

  const handleSpeculativeEnabledChange = (e: any) => {
    if (e.target.checked) {
      form.setFieldValue('speculative_config', {
        enabled: true,
        url: proxyConfigRef.current?.url || '',
        timeout: proxyConfigRef.current?.timeout || 30
      });
    } else {
      proxyConfigRef.current = form.getFieldValue('proxy_config');
    }
  };

  return (
    <>
      <Form.Item
        name={['proxy_config', 'enabled']}
        valuePropName="checked"
        style={{ marginBottom: 8 }}
      >
        <CheckboxField
          label={'Enable Proxy'}
          onChange={handleSpeculativeEnabledChange}
        ></CheckboxField>
      </Form.Item>
      {proxyConfigEnabled && (
        <>
          <Form.Item name={['proxy_config', 'url']}>
            <SealInput.Input
              label={'Proxy URL'}
              placeholder="http://proxy.example.com:8080"
            ></SealInput.Input>
          </Form.Item>
          <Form.Item name={['proxy_config', 'timeout']}>
            <SealInput.Number
              label={'Proxy Timeout'}
              placeholder="30"
            ></SealInput.Number>
          </Form.Item>
        </>
      )}
    </>
  );
};

export default AdvanceConfig;
