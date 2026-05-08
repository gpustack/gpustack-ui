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
          command: currentData.command || [],
          ports: currentData.ports || [],
          env: currentData.env || [],
          volumeMount: currentData.volumeMount,
          resources: {
            cpu: currentData.resources?.cpu,
            ram: currentData.resources?.ram
          }
        });
        return;
      }

      form.setFieldsValue({
        command: [],
        ports: [
          {
            protocol: 'tcp',
            port: 22
          }
        ],
        env: []
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
      >
        <Basic />
      </Form>
    );
  }
);

export default GPUServiceTemplateForm;
