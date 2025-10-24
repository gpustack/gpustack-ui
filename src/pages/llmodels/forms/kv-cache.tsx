import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const KVCacheForm = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { onValuesChange } = useFormContext();
  const kvCacheEnabled = Form.useWatch(['extended_kv_cache', 'enabled'], form);

  const handleOnChange = async (e: any) => {
    if (e.target.checked) {
      form.setFieldsValue({
        extended_kv_cache: {
          enabled: true,
          chunk_size: 256,
          max_local_cpu_size: 10,
          remote_url: ''
        }
      });
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    onValuesChange?.({}, form.getFieldsValue());
  };

  return (
    <>
      <div style={{ paddingBottom: 22 }}>
        <Form.Item<FormData>
          data-field="extended_kv_cache.enabled"
          name={['extended_kv_cache', 'enabled']}
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
        >
          <CheckboxField
            onChange={handleOnChange}
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
