import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { DefaultImagePullPolicy } from '../config';
import { FormData, ListItem } from '../config/types';
import Basic from './basic';

interface TemplateFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
}

const GPUServiceTemplateForm: React.FC<TemplateFormProps> = forwardRef(
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
          ...currentData
        });
        return;
      }
    }, [action, currentData, form, open]);

    const handleFinish = async (values: FormData) => {
      await onFinish({
        ...values,
        displayName: values.displayName?.trim() || values.name,
        spec: {
          ...values.spec,
          command: values.spec?.command?.filter(Boolean) ?? []
        }
      });
    };

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
        onFinish={handleFinish}
        onFinishFailed={onFinishFailed}
        preserve={false}
        scrollToFirstError
        initialValues={{
          spec: {
            imagePullPolicy: DefaultImagePullPolicy,
            command: ['tail', '-f', '/dev/null'],
            ports: [
              {
                protocol: 'TCP',
                port: 22,
                name: 'SSH'
              }
            ],
            volumeMount: '/workspace',
            resources: {
              cpu: '1',
              ram: '2Gi',
              localStorage: '15Gi',
              accelerator: ''
            },
            env: []
          }
        }}
      >
        <Basic action={action} />
      </Form>
    );
  }
);

export default GPUServiceTemplateForm;
