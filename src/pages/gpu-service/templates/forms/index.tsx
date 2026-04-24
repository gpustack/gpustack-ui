import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { FormData, ListItem } from '../config/types';
import Basic from './basic';

interface TemplateFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
  onFinish: (values: FormData) => Promise<void>;
}

const GPUServiceTemplateForm: React.FC<TemplateFormProps> = forwardRef(
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
          image: currentData.image,
          vendor: currentData.vendor,
          image_pull_policy: currentData.image_pull_policy,
          run_command: currentData.run_command,
          boot_disk_size_gb: currentData.boot_disk_size_gb,
          volume_size_gb: currentData.volume_size_gb,
          volume_mount_path: currentData.volume_mount_path,
          ports: currentData.ports || [],
          env: currentData.env || {}
        });
        return;
      }

      form.setFieldsValue({
        ports: [
          {
            protocol: 'tcp',
            value: 22
          }
        ],
        env: {}
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
        name="gpuServiceTemplateForm"
        form={form}
        onFinish={onFinish}
        preserve={false}
        initialValues={{
          boot_disk_size_gb: 30,
          ports: [
            {
              protocol: 'udp',
              value: 22
            }
          ]
        }}
      >
        <Basic />
      </Form>
    );
  }
);

export default GPUServiceTemplateForm;
