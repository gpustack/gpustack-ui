import { CheckboxField, Select as SealSelect } from '@gpustack/core-ui';
import { useIntl, useSearchParams } from '@umijs/max';
import { Form } from 'antd';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import ModelSelect from '../../components/model-select';
import { defaultLanguages } from '../../config';
import { FormContext } from '../../config/form-context';
import { allLanguages } from '../../config/languages';

type ParamsSettingsProps = {
  ref?: any;
  modelList?: Global.BaseOption<string>[];
  onFinish?: (values: any) => void;
  onFinishFailed?: (errorInfo: any) => void;
  updateParams: (values: Record<string, any>) => void;
};

const STTForm: React.FC<ParamsSettingsProps> = forwardRef(
  ({ onFinish, onFinishFailed, modelList, updateParams }, ref) => {
    const intl = useIntl();
    const [form] = Form.useForm();
    const [meta, setModelMeta] = React.useState<Record<string, any>>({});
    const [languageOptions, setLanguageOptions] = useState<
      Global.BaseOption<string>[]
    >([]);
    const [searchParams] = useSearchParams();
    const modelType = searchParams.get('type') || '';
    const selectModel = searchParams.get('model')
      ? modelType === 'stt' && searchParams.get('model')
      : '';
    const initializeRef = useRef<boolean>(false);

    useImperativeHandle(ref, () => ({
      form,
      getFieldsValue: form.getFieldsValue,
      setFieldsValue: form.setFieldsValue
    }));

    const handleOnFinish = (values: any) => {
      onFinish?.(values);
    };

    const handleOnFinishFailed = (errorInfo: any) => {
      onFinishFailed?.(errorInfo);
    };

    const updateLanguages = (meta: Record<string, any>) => {
      const languages = meta?.languages || [];
      if (languages.length === 0) {
        return defaultLanguages;
      }

      const currentLanguage: { label: string; value: string }[] = [];
      languages.forEach((langCode: string) => {
        const langItem = allLanguages.find((item) => item.value === langCode);
        if (langItem) {
          currentLanguage.push(langItem);
        }
      });
      setLanguageOptions(currentLanguage);
      return currentLanguage;
    };

    const handleSelectModel = (model: string) => {
      if (!model) return;
      const selected = modelList?.find((item) => item.value === model);
      setModelMeta(selected?.meta || {});
      const languages = updateLanguages(selected?.meta || {});

      const values = {
        language: selected?.meta?.language || languages[0]?.value || 'auto',
        model: model
      };

      updateParams(values);
      form.setFieldsValue(values);
    };

    const handleOnValuesChange = (changedValues: any, allValues: any) => {
      if (changedValues.model) {
        return;
      }
      updateParams(allValues);
    };

    useEffect(() => {
      if (initializeRef.current || !modelList?.length) return;

      const defaultModel = selectModel || modelList?.[0]?.value || '';
      handleSelectModel(defaultModel);
      initializeRef.current = true;
    }, [modelList, selectModel]);

    return (
      <FormContext.Provider
        value={{
          meta,
          modelList: modelList || [],
          onValuesChange: handleOnValuesChange,
          onModelChange: handleSelectModel
        }}
      >
        <Form
          form={form}
          onValuesChange={handleOnValuesChange}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
          initialValues={{
            model: '',
            language: 'auto'
          }}
        >
          <ModelSelect></ModelSelect>
          <Form.Item name="language">
            <SealSelect
              label={intl.formatMessage({ id: 'playground.params.language' })}
              options={languageOptions}
            ></SealSelect>
          </Form.Item>
          <Form.Item
            name="stream"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <CheckboxField
              label={intl.formatMessage({
                id: 'playground.params.streamMode'
              })}
            ></CheckboxField>
          </Form.Item>
        </Form>
      </FormContext.Provider>
    );
  }
);

export default STTForm;
