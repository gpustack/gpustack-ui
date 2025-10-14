import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import KVCacheForm from './kv-cache';

const Performance: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();

  return (
    <>
      <KVCacheForm></KVCacheForm>
      {/* <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
        <Form.Item<FormData>
          name="optimize_long_prompt"
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
          noStyle
        >
          <CheckboxField
            label={intl.formatMessage({ id: 'models.form.optimizeLongPrompt' })}
          ></CheckboxField>
        </Form.Item>
      </div>
      <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
        <Form.Item<FormData>
          name="enable_speculative_decoding"
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
          noStyle
        >
          <CheckboxField
            label={intl.formatMessage({
              id: 'models.form.enableSpeculativeDecoding'
            })}
          ></CheckboxField>
        </Form.Item>
      </div> */}
    </>
  );
};

export default Performance;
