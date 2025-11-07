import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
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
    const intl = useIntl();
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

    const handleOnFinish = (values: FormData) => {
      const data = {
        ...values,
        backend_name: currentData?.is_built_in
          ? values.backend_name
          : `${values.backend_name}-custom`
      };
      data.version_configs = data.version_configs?.map((item) => {
        if (item.version_no) {
          return {
            ...item,
            version_no: currentData?.is_built_in
              ? `${item.version_no}-custom`
              : item.version_no
          };
        }
        return item;
      });
      onFinish(data);
    };

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
        onFinish={handleOnFinish}
        preserve={false}
        scrollToFirstError={true}
        initialValues={_.omit(currentData, ['version_configs'])}
        onFinishFailed={onFinishFailed}
      >
        <BasicForm action={action} currentData={currentData}></BasicForm>
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
