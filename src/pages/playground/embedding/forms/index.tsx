import { Form } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import ModelSelect from '../../components/model-select';
import { FormContext } from '../../config/form-context';
import AdvanceConfig from './advance-config';

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
      meta
    },
    ref
  ) => {
    const [form] = Form.useForm();

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
          onValuesChange={onValuesChange}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
          initialValues={initialValues}
        >
          <ModelSelect
            title={parametersTitle}
            showModelSelector={showModelSelector}
          ></ModelSelect>
          <AdvanceConfig></AdvanceConfig>
        </Form>
      </FormContext.Provider>
    );
  }
);

export default ParamsSettings;
