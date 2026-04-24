import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { StorageStatusValueMap } from '../config';
import { FormData, ListItem } from '../config/types';
import Basic from './basic';

interface StorageFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
  onFinish: (values: FormData) => Promise<void>;
}

const GPUServiceStorageForm: React.FC<StorageFormProps> = forwardRef(
  (props, ref) => {
    const { action, currentData, open, onFinish } = props;
    const [form] = Form.useForm<FormData>();

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }

      if (action === PageAction.EDIT && currentData) {
        form.setFieldsValue({
          name: currentData.name,
          description: currentData.description,
          type: currentData.type,
          capacity_gb: currentData.capacity_gb,
          mount_path: currentData.mount_path,
          access_modes: currentData.access_modes,
          parameters: currentData.parameters,
          status: currentData.status
        });
        return;
      }

      form.setFieldsValue({
        type: '默认存储',
        parameters: {},
        status: StorageStatusValueMap.Available
      });
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
      >
        <Basic />
      </Form>
    );
  }
);

export default GPUServiceStorageForm;
