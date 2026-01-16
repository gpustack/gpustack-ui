import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle } from 'react';
import { MaasProviderItem as ListItem } from '../config/types';

interface ProviderFormProps {
  ref?: any;
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  onFinish: (values: FormData) => void;
}

const ProviderForm: React.FC<ProviderFormProps> = forwardRef((props, ref) => {
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    submit: () => {
      form.submit();
    },
    resetFields: () => {
      form.resetFields();
    }
  }));

  return (
    <Form form={form} layout="vertical">
      {/* Form fields go here */}
    </Form>
  );
});

export default ProviderForm;
