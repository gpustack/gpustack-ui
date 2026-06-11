import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { FormData, ListItem } from '../config/types';
import Basic from './basic';

interface PublicKeyFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
}

const GPUServicePublicKeyForm: React.FC<PublicKeyFormProps> = forwardRef(
  (props, ref) => {
    const { action, currentData, open, onFinish, onFinishFailed } = props;
    const [form] = Form.useForm<FormData>();

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }

      if (action === PageAction.EDIT && currentData) {
        form.setFieldsValue({
          name: currentData.name as string,
          displayName: currentData.displayName,
          description: currentData.description,
          spec: {
            data: currentData.spec?.data ?? ''
          }
        });
      }
    }, [action, currentData, form, open]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.submit();
      },
      resetFields: () => {
        form.resetFields();
      }
    }));

    return (
      <Form
        name="gpuServicePublicKeyForm"
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        preserve={false}
        initialValues={{}}
      >
        <Basic action={action} />
      </Form>
    );
  }
);

export default GPUServicePublicKeyForm;
