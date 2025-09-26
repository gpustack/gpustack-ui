import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { Form } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { FormData, ListItem } from '../config/types';
import BasicForm from './basic';
import ParametersForm from './parameters';
import VersionsForm from './versions-config';

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  onFinish: (values: FormData) => void;
  ref?: any;
};
const BackendForm: React.FC<AddModalProps> = forwardRef(
  ({ action, currentData, onFinish }, ref) => {
    const [form] = Form.useForm();

    useEffect(() => {
      if (currentData) {
        form.setFieldsValue(currentData);
      }
    }, [currentData]);

    useImperativeHandle(ref, () => ({
      resetFields: () => {
        form.resetFields();
      },
      submit: () => {
        form.submit();
      },
      setFieldsValue: (values: any) => {
        form.setFieldsValue(values);
      },
      getFieldsValue: () => {
        return form.getFieldsValue();
      },
      validateFields: async () => {
        return await form.validateFields();
      }
    }));

    return (
      <Form
        name="basicForm"
        form={form}
        onFinish={onFinish}
        preserve={false}
        scrollToFirstError={true}
        initialValues={currentData}
      >
        <BasicForm action={action}></BasicForm>
        <CollapsePanel
          items={[
            {
              key: 'versions',
              label: 'Versions',
              children: <VersionsForm action={action}></VersionsForm>
            },
            {
              key: 'parameters',
              label: 'Default Parameters',
              children: <ParametersForm action={action}></ParametersForm>
            }
          ]}
        ></CollapsePanel>
      </Form>
    );
  }
);

export default BackendForm;
