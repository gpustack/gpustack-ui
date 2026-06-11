import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { FormData, ListItem } from '../config/types';
import Basic from './basic';

interface StorageFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
}

const GPUServiceStorageForm: React.FC<StorageFormProps> = forwardRef(
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
          name: currentData.name,
          displayName: currentData.displayName,
          description: currentData.description,
          spec: {
            capacity: currentData.spec?.capacity,
            type: currentData.spec?.type
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
        name="gpuServiceStorageForm"
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        preserve={false}
        initialValues={{}}
      >
        <Basic action={action} open={open} />
      </Form>
    );
  }
);

export default GPUServiceStorageForm;
