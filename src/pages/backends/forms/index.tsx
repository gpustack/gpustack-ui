import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { Form } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { FormData, ListItem } from '../config/types';
import BasicForm from './basic';
import BuiltInVersionsForm from './built-in-versions';
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
        const hasVersionsError = errorFields.some((field: any) =>
          field.name.includes('version_configs')
        );
        if (hasVersionsError) {
          setActiveKey([...new Set([...activeKey, 'version_configs'])]);
        }
      }
    };

    const handleOnCollapseChange = (keys: string | string[]) => {
      setActiveKey(Array.isArray(keys) ? keys : [keys]);
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

        <CollapsePanel
          activeKey={activeKey}
          accordion={false}
          onChange={handleOnCollapseChange}
          items={[
            ...(currentData?.is_build_in
              ? [
                  {
                    key: 'builtin_version_configs',
                    label: 'Built-in Versions',
                    forceRender: true,
                    children: <BuiltInVersionsForm></BuiltInVersionsForm>
                  }
                ]
              : [])
          ]}
        ></CollapsePanel>
        <VersionsForm action={action} currentData={currentData}></VersionsForm>
      </Form>
    );
  }
);

export default BackendForm;
