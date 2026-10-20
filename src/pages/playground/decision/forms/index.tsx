import { Form } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import ModelSelect from '../../components/model-select';
import { FormContext } from '../../config/form-context';

type DataFormProps = {
  ref?: any;
  modelList?: Global.BaseOption<string>[];
  onValuesChange?: (changeValues: any, value: Record<string, any>) => void;
  onModelChange?: (model: string) => void;
  initialValues?: Record<string, any>;
};

// The decision playground's parameter panel: a model selector and nothing
// else — systemone has no tunable inference parameters (temperature etc.).
const DataForm: React.FC<DataFormProps> = forwardRef(
  ({ onValuesChange, onModelChange, initialValues, modelList }, ref) => {
    const [form] = Form.useForm();

    useImperativeHandle(ref, () => ({
      form,
      getFieldsValue: form.getFieldsValue,
      setFieldsValue: form.setFieldsValue
    }));

    return (
      <FormContext.Provider
        value={{
          modelList: modelList || [],
          onValuesChange: onValuesChange,
          onModelChange: onModelChange
        }}
      >
        <Form
          form={form}
          onValuesChange={onValuesChange}
          initialValues={initialValues}
        >
          <ModelSelect></ModelSelect>
        </Form>
      </FormContext.Provider>
    );
  }
);

export default DataForm;
