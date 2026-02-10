import MetadataList from '@/components/metadata-list';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useRef } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData, ProviderModel } from '../config/types';
import { useQueryProviderModels } from '../hooks/use-query-provider-models';
import ModelItem from './model-item';

const SupportedModels = () => {
  const intl = useIntl();
  const { providerModelList, loading, fetchProviderModels } =
    useQueryProviderModels();
  const form = Form.useFormInstance<FormData>();
  const modelList = Form.useWatch('models', form) || [];
  const prevAPIKeyRef = useRef<string>('');
  const { getRuleMessage } = useAppUtils();
  const { id, action, currentData } = useFormContext();

  const generateCurrentAPIKey = (currentAPIKey: string) => {
    if (
      action === PageAction.EDIT &&
      currentAPIKey === currentData?.api_tokens?.[0]?.hash
    ) {
      return undefined;
    }
    return currentAPIKey;
  };

  const generateID = () => {
    if (action === PageAction.EDIT || action === PageAction.COPY) {
      return id!;
    }
    return 0;
  };

  const handleOpenChange = async (open: boolean) => {
    try {
      await form.validateFields(['api_key', ['config', 'type']]);

      const currentAPIKey = form.getFieldValue('api_key') || '';

      // Avoid repeated requests with the same API key
      if (open && prevAPIKeyRef.current !== currentAPIKey && currentAPIKey) {
        prevAPIKeyRef.current = currentAPIKey;
        fetchProviderModels({
          id: generateID(),
          data: {
            api_token: generateCurrentAPIKey(currentAPIKey) as string,
            proxy_url: form.getFieldValue('proxy_url') || undefined,
            config: {
              type: form.getFieldValue(['config', 'type']) || ''
            }
          }
        });
      }
    } catch (error) {
      prevAPIKeyRef.current = '';
    }
  };

  const updateModelList = (models: ProviderModel[]) => {
    form.setFieldsValue({
      models: models
    });
  };

  const onAdd = () => {
    const newList = [...modelList];
    newList.push({ name: '', category: '', accessible: null });
    updateModelList(newList);
  };

  const onDelete = (index: number) => {
    const newList = [...modelList];
    newList.splice(index, 1);
    updateModelList(newList);
  };

  const onChange = (data: ProviderModel, index: number) => {
    const newList = [...modelList];
    newList[index] = { ...data };
    updateModelList(newList);
  };

  return (
    <>
      <Form.Item
        name="models"
        data-field="supportedModels"
        rules={[
          {
            required: true,
            validator: async (_, value) => {
              if (!value || value.length === 0) {
                return Promise.reject(
                  new Error(
                    getRuleMessage('input', 'providers.form.rules.models')
                  )
                );
              }

              if (value.some((item: ProviderModel) => !item.name)) {
                return Promise.reject(
                  new Error(
                    getRuleMessage('select', 'providers.form.rules.model')
                  )
                );
              }
              return Promise.resolve();
            }
          }
        ]}
      >
        <MetadataList
          styles={{
            wrapper: {
              paddingTop: 14
            }
          }}
          dataList={modelList}
          label=""
          btnText={intl.formatMessage({ id: 'providers.form.models.add' })}
          onAdd={onAdd}
          onDelete={onDelete}
        >
          {(item, index) => (
            <ModelItem
              key={index}
              selectedModelList={modelList}
              onOpenChange={handleOpenChange}
              onChange={(data) => onChange(data, index)}
              loading={loading}
              providerModelList={providerModelList}
              item={item}
            ></ModelItem>
          )}
        </MetadataList>
      </Form.Item>
    </>
  );
};

export default SupportedModels;
