import ListInput from '@/components/list-input';
import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import React from 'react';
import { FormData } from '../config/types';

type AddModalProps = {
  action: PageActionType;
};
const ParametersForm: React.FC<AddModalProps> = ({ action }) => {
  const form = Form.useFormInstance();

  return (
    <>
      <Form.Item<FormData>
        name="default_backend_param"
        rules={[{ required: false }]}
      >
        <ListInput
          dataList={form.getFieldValue('default_backend_param') || []}
          onChange={(data: string[]) => {
            form.setFieldValue('default_backend_param', data);
          }}
          btnText={'Add Backend Parameter'}
          label={'Default Backend Parameters'}
        ></ListInput>
      </Form.Item>
    </>
  );
};

export default ParametersForm;
