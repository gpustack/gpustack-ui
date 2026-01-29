import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInputNumber from '@/components/seal-form/input-number';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useMemo, useRef } from 'react';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const KVCacheForm = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { onValuesChange, flatBackendOptions, formKey } = useFormContext();
  const kvCacheEnabled = Form.useWatch(['extended_kv_cache', 'enabled'], form);
  const backend = Form.useWatch('backend', form);
  const configCacheRef = useRef<any>({});

  const handleEnableOnChange = async (e: any) => {
    if (e.target.checked) {
      form.setFieldsValue({
        extended_kv_cache: {
          enabled: true,
          chunk_size: configCacheRef.current?.chunk_size || null,
          ram_ratio: configCacheRef.current?.ram_ratio || 1.2,
          ram_size: configCacheRef.current?.ram_size || null
        }
      });
    } else {
      configCacheRef.current = form.getFieldValue('extended_kv_cache');
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    onValuesChange?.(
      {
        extended_kv_cache: {
          enabled: e.target.checked
        }
      },
      form.getFieldsValue()
    );
  };

  const handleRamRatioChange = (
    value: number | null | string,
    field: string
  ) => {
    if (!value) {
      form.setFieldValue(['extended_kv_cache', field], null);
    }
  };

  const handleRamSizeInput = (value: number | null | string) => {
    if (!value) {
      form.setFieldValue(['extended_kv_cache', 'ram_size'], null);
    } else {
      form.setFieldValue(['extended_kv_cache', 'ram_size'], _.round(value));
    }
    onValuesChange?.(
      {
        extended_kv_cache: {
          ram_size: value
        }
      },
      form.getFieldsValue()
    );
  };

  const builtInBackend = useMemo(() => {
    const currentBackend = flatBackendOptions.find(
      (item) => item.value === backend
    );

    return (
      currentBackend?.isBuiltIn &&
      [backendOptionsMap.SGLang, backendOptionsMap.vllm].includes(
        backend as string
      )
    );
  }, [backend, flatBackendOptions]);

  return (
    <>
      <Form.Item<FormData>
        data-field="extended_kv_cache.enabled"
        name={['extended_kv_cache', 'enabled']}
        valuePropName="checked"
        style={{ marginBottom: 8 }}
      >
        <CheckboxField
          description={intl.formatMessage({
            id: 'models.form.kvCache.tips2'
          })}
          disabled={!builtInBackend}
          onChange={handleEnableOnChange}
          label={intl.formatMessage({ id: 'models.form.extendedkvcache' })}
        ></CheckboxField>
      </Form.Item>
      {kvCacheEnabled && (
        <>
          <Form.Item<FormData> name={['extended_kv_cache', 'ram_ratio']}>
            <SealInputNumber
              onChange={(value) => handleRamRatioChange(value, 'ram_ratio')}
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
              onInput={(value) => handleRamSizeInput(value)}
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
              onChange={(value) => handleRamRatioChange(value, 'chunk_size')}
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
