import MetadataList from '@/components/metadata-list';
import { PageAction } from '@/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
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
  const prevConfigRef = useRef<{
    type: string;
    api_key: string;
    openaiCustomUrl: string;
  }>({ type: '', api_key: '', openaiCustomUrl: '' });
  const { id, action, currentData, getCustomConfig } = useFormContext();

  const generateCurrentAPIKey = (currentAPIKey: string) => {
    if (
      [PageAction.EDIT, PageAction.COPY].includes(action) &&
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

  const checkConfigChange = (current: {
    type: string;
    api_key: string;
    openaiCustomUrl: string;
  }) => {
    return (
      !_.isEqual(current, prevConfigRef.current) &&
      current.api_key &&
      current.type
    );
  };

  const handleOpenChange = async (open: boolean) => {
    try {
      await form.validateFields(['api_key', ['config', 'type']]);

      const proxyConfigEnabled = form.getFieldValue('proxy_enabled');
      const currentAPIKey = form.getFieldValue('api_key') || '';
      const configType = form.getFieldValue(['config', 'type']);
      const openaiCustomUrl = form.getFieldValue(['config', 'openaiCustomUrl']);
      const customConfig = getCustomConfig?.();

      const currentConfig = {
        type: configType,
        api_key: currentAPIKey,
        openaiCustomUrl: customConfig?.openaiCustomUrl || openaiCustomUrl || ''
      };

      // Avoid repeated requests with the same API key
      if (open && checkConfigChange(currentConfig)) {
        prevConfigRef.current = {
          ...currentConfig
        };

        fetchProviderModels({
          id: generateID(),
          data: {
            api_token: generateCurrentAPIKey(currentAPIKey) as string,
            proxy_url: proxyConfigEnabled
              ? form.getFieldValue('proxy_url') || null
              : null,
            config: {
              type: form.getFieldValue(['config', 'type']) || '',
              ...customConfig,
              openaiCustomUrl:
                customConfig?.openaiCustomUrl || openaiCustomUrl || null
            }
          }
        });
      }
    } catch (error) {
      prevConfigRef.current = {
        type: '',
        api_key: '',
        openaiCustomUrl: ''
      };
      // If validation fails, reset the provider model list to avoid confusion
    }
  };

  const updateModelList = (models: ProviderModel[]) => {
    form.setFieldsValue({
      models: models
    });
  };

  const onAdd = () => {
    const newList = [...modelList];
    newList.push({ name: '', category: undefined, accessible: null });
    updateModelList(newList);
  };

  const onDelete = (index: number) => {
    const newList = [...modelList];
    newList.splice(index, 1);
    updateModelList(newList);
  };

  const onChange = (data: ProviderModel, index: number) => {
    const dataList = form.getFieldValue('models') || [];
    const newList = [...dataList];
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
                    intl.formatMessage({ id: 'providers.form.rules.models' })
                  )
                );
              }

              if (value.some((item: ProviderModel) => !item.name)) {
                return Promise.reject(
                  new Error(
                    intl.formatMessage({ id: 'providers.form.rules.model' })
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
