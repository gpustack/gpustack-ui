import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInputNumber from '@/components/seal-form/input-number';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo, useRef } from 'react';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const KVCacheForm = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { onValuesChange, backendOptions } = useFormContext();
  const kvCacheEnabled = Form.useWatch(['extended_kv_cache', 'enabled'], form);
  const backend = Form.useWatch('backend', form);
  const configCacheRef = useRef<any>({});

  const handleOnChange = async (e: any) => {
    if (e.target.checked) {
      form.setFieldsValue({
        extended_kv_cache: {
          enabled: true,
          chunk_size: configCacheRef.current?.chunk_size,
          ram_ratio: configCacheRef.current?.ram_ratio || 1.2,
          ram_size: configCacheRef.current?.ram_size
        }
      });
    } else {
      configCacheRef.current = form.getFieldValue('extended_kv_cache');
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    onValuesChange?.({}, form.getFieldsValue());
  };

  const builtInBackend = useMemo(() => {
    const currentBackend = backendOptions.find(
      (item) => item.value === backend
    );

    return (
      currentBackend?.isBuiltIn &&
      [backendOptionsMap.SGLang, backendOptionsMap.vllm].includes(
        backend as string
      )
    );
  }, [backend, backendOptions]);

  return (
    <>
      <div style={{ paddingBottom: 22 }}>
        <Form.Item<FormData>
          data-field="extended_kv_cache.enabled"
          name={['extended_kv_cache', 'enabled']}
          valuePropName="checked"
          style={{ padding: '0 10px', marginBottom: 0 }}
          extra={
            !builtInBackend && (
              <span
                dangerouslySetInnerHTML={{
                  __html: intl.formatMessage({ id: 'models.form.kvCache.tips' })
                }}
              ></span>
            )
          }
        >
          <CheckboxField
            description={intl.formatMessage({
              id: 'models.form.kvCache.tips2'
            })}
            disabled={!builtInBackend}
            onChange={handleOnChange}
            label={intl.formatMessage({ id: 'models.form.extendedkvcache' })}
          ></CheckboxField>
        </Form.Item>
      </div>
      {kvCacheEnabled && (
        <>
          <Form.Item<FormData> name={['extended_kv_cache', 'ram_ratio']}>
            <SealInputNumber
              label={intl.formatMessage({ id: 'models.form.ramRatio' })}
              description={intl.formatMessage({
                id: 'models.form.ramRatio.tips'
              })}
              min={0}
              step={0.1}
              precision={1}
            />
          </Form.Item>
          <Form.Item<FormData> name={['extended_kv_cache', 'ram_size']}>
            <SealInputNumber
              label={intl.formatMessage({ id: 'models.form.ramSize' })}
              description={intl.formatMessage(
                {
                  id: 'models.form.ramSize.tips'
                },
                { content: intl.formatMessage({ id: 'models.form.ramRatio' }) }
              )}
              min={0}
              step={1}
              precision={0}
            />
          </Form.Item>
          <Form.Item<FormData> name={['extended_kv_cache', 'chunk_size']}>
            <SealInputNumber
              label={intl.formatMessage({ id: 'models.form.chunkSize' })}
              description={intl.formatMessage({
                id: 'models.form.chunkSize.tips'
              })}
              min={0}
              step={1}
            />
          </Form.Item>
        </>
      )}
    </>
  );
};

export default KVCacheForm;
