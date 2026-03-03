import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInputNumber from '@/components/seal-form/input-number';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import ModelSelect from '../../components/model-select';
import ParamsFields from '../../components/params-fields';
import { FormContext } from '../../config/form-context';
import { ParamsSchema } from '../../config/types';

type ParamsSettingsProps = {
  ref?: any;
  parametersTitle?: React.ReactNode;
  showModelSelector?: boolean;
  modelList?: Global.BaseOption<string>[];
  onValuesChange?: (changeValues: any, value: Record<string, any>) => void;
  onModelChange?: (model: string) => void;
  onFinish?: (values: any) => void;
  onFinishFailed?: (errorInfo: any) => void;
  initialValues?: Record<string, any>; // for initial values when switch model, aviod update values from setParams
  meta?: Record<string, any>;
  paramsConfig?: ParamsSchema[];
};

const ParamsSettings: React.FC<ParamsSettingsProps> = forwardRef(
  (
    {
      onValuesChange,
      onModelChange,
      onFinish,
      onFinishFailed,
      parametersTitle,
      initialValues,
      modelList,
      showModelSelector = true,
      meta,
      paramsConfig
    },
    ref
  ) => {
    const intl = useIntl();
    const [form] = Form.useForm();
    const randomSeed = Form.useWatch('random_seed', form);

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

    const handleOnValuesChange = (
      changeValues: any,
      allValues: Record<string, any>
    ) => {
      const normalizedValues = Object.fromEntries(
        Object.entries(changeValues).map(([key, value]: [string, any]) => [
          key,
          value?.target?.checked ?? value?.target?.value ?? value
        ])
      );
      form.setFieldsValue(normalizedValues);
      onValuesChange?.(normalizedValues, {
        ...allValues,
        ...normalizedValues
      });
    };

    useEffect(() => {
      form.setFieldsValue(initialValues);
    }, [initialValues]);

    return (
      <FormContext.Provider
        value={{
          meta,
          modelList: modelList || [],
          onValuesChange: onValuesChange,
          onModelChange: onModelChange
        }}
      >
        <Form
          form={form}
          onValuesChange={handleOnValuesChange}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
          initialValues={initialValues}
        >
          <ModelSelect
            title={parametersTitle}
            showModelSelector={showModelSelector}
          ></ModelSelect>
          <ParamsFields paramsConfig={paramsConfig}></ParamsFields>
          <Form.Item name="seed">
            <SealInputNumber
              disabled={randomSeed}
              label={intl.formatMessage({ id: 'playground.image.params.seed' })}
            ></SealInputNumber>
          </Form.Item>
          <Form.Item
            name="random_seed"
            style={{ marginBottom: 20 }}
            noStyle
            valuePropName="checked"
          >
            <CheckboxField
              label={intl.formatMessage({
                id: 'playground.image.params.randomseed'
              })}
            ></CheckboxField>
          </Form.Item>
        </Form>
      </FormContext.Provider>
    );
  }
);

export default ParamsSettings;
