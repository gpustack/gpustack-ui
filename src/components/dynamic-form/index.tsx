import { Form } from 'antd';
import React from 'react';
import { FieldSchema } from './config/types';

interface DynamicFormProps {
  schema: FieldSchema;
  onSubmit: (values: any) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ schema, onSubmit }) => {
  const form = Form.useFormInstance();

  const handleFinish = (values: any) => {
    onSubmit(values);
  };

  return (
    <>
      <Form form={form} onFinish={handleFinish}>
        {/* Render form fields based on schema */}
      </Form>
    </>
  );
};

export default DynamicForm;
