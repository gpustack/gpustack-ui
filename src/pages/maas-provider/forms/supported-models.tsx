import MetadataList from '@/components/metadata-list';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData, ProviderModel } from '../config/types';
import { useQueryProviderModels } from '../hooks/use-query-provider-models';
import ModelItem from './model-item';

const SupportedModels = () => {
  const intl = useIntl();
  const { providerModelList, loading, fetchProviderModels } =
    useQueryProviderModels();
  const form = Form.useFormInstance<FormData>();
  const modelList = Form.useWatch('models', form) || [];

  const handleOpenChange = async (open: boolean) => {
    try {
      await form.validateFields(['api_key']);

      if (open && providerModelList.length === 0) {
        fetchProviderModels({
          data: {
            api_token: form.getFieldValue('api_key') || '',
            config: {
              type: form.getFieldValue(['config', 'type']) || ''
            }
          }
        });
      }
    } catch (error) {}
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
      <Form.Item name="models" data-field="supportedModels">
        <MetadataList
          dataList={modelList}
          label={intl.formatMessage({ id: 'providers.table.models' })}
          btnText={intl.formatMessage({ id: 'providers.form.models.add' })}
          onAdd={onAdd}
          onDelete={onDelete}
        >
          {(item, index) => (
            <ModelItem
              key={index}
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
