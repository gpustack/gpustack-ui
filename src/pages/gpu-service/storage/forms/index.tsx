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
  namespace?: string;
  onFinish: (values: FormData) => Promise<void>;
}

const GPUServiceStorageForm: React.FC<StorageFormProps> = forwardRef(
  (props, ref) => {
    const {
      action,
      currentData,
      open,
      namespace = 'default',
      onFinish
    } = props;
    const [form] = Form.useForm<FormData>();

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }

      if (action === PageAction.EDIT && currentData) {
        form.setFieldsValue({
          metadata: {
            name: currentData.metadata?.name,
            namespace: currentData.metadata?.namespace
          },
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
        preserve={false}
        initialValues={{}}
      >
        <Basic open={open} />
      </Form>
    );
  }
);

export default GPUServiceStorageForm;
