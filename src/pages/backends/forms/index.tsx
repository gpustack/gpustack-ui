import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { FormData, ListItem } from '../config/types';
import BasicForm from './basic';
import VersionsForm from './versions-config';

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem;
  onFinish: (values: FormData) => void;
  ref?: any;
};
const BackendForm: React.FC<AddModalProps> = forwardRef(
  ({ action, currentData, onFinish }, ref) => {
    const [form] = Form.useForm();
    const [activeKey, setActiveKey] = React.useState<string[]>([]);

    const onFinishFailed = (errorInfo: any) => {
      const errorFields = errorInfo.errorFields || [];
      if (errorFields.length > 0) {
        const versionError = errorFields.find((field: any) =>
          field.name.includes('version_configs')
        );
        if (versionError) {
          setActiveKey([...new Set([versionError.name[1]])]);
        } else {
          setActiveKey([]);
        }
      }
    };

    useEffect(() => {
      if (currentData) {
        console.log('currentData:', currentData);
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
        initialValues={_.omit(currentData, ['version_configs'])}
        onFinishFailed={onFinishFailed}
      >
        <BasicForm action={action}></BasicForm>
        <VersionsForm
          action={action}
          currentData={currentData}
          activeKey={activeKey}
        ></VersionsForm>
      </Form>
    );
  }
);

export default BackendForm;
