import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const KVCacheForm = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const kvCacheEnabled = Form.useWatch(['extended_kv_cache', 'enabled'], form);

  return (
    <>
      <div style={{ paddingBottom: 22 }}>
        <Form.Item<FormData>
          name={['extended_kv_cache', 'enabled']}
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
          noStyle
        >
          <CheckboxField
            label={intl.formatMessage({ id: 'models.form.extendedkvcache' })}
          ></CheckboxField>
        </Form.Item>
      </div>
      {kvCacheEnabled && (
        <>
          <Form.Item<FormData>
            name={['extended_kv_cache', 'max_local_cpu_size']}
          >
            <SealInputNumber
              label={intl.formatMessage({ id: 'models.form.maxCPUSize' })}
              min={0}
              step={1}
              precision={0}
            />
          </Form.Item>
          <Form.Item<FormData> name={['extended_kv_cache', 'chunk_size']}>
            <SealInputNumber
              label={intl.formatMessage({ id: 'models.form.chunkSize' })}
              min={0}
              step={1}
            />
          </Form.Item>
          <Form.Item<FormData> name={['extended_kv_cache', 'remote_url']}>
            <SealInput.Input
              label={intl.formatMessage({ id: 'models.form.remoteURL' })}
              min={0}
              step={1}
              placeholder="protocol://host:port"
            />
          </Form.Item>
        </>
      )}
    </>
  );
};

export default KVCacheForm;
