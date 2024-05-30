import FormButtons from '@/components/form-buttons';
import SealInput from '@/components/seal-form/seal-input';
import { INPUT_WIDTH } from '@/constants';
import { PageContainer } from '@ant-design/pro-components';
import { Form } from 'antd';
import { StrictMode } from 'react';

interface ProfileProps {
  name: string;
  password: string;
  originalPassword: string;
  email: string;
}
const Profile: React.FC = () => {
  const [form] = Form.useForm();

  const handleOnFinish = (values: any) => {
    console.log('handleOnFinish', values);
  };

  const handleOnFinishFailed = (errorInfo: any) => {
    console.log('handleOnFinishFailed', errorInfo);
  };

  return (
    <StrictMode>
      <PageContainer
        ghost
        header={{
          title: 'Profile'
        }}
        extra={[]}
      >
        <Form
          style={{ width: '524px' }}
          name="profileForm"
          form={form}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
        >
          <Form.Item<ProfileProps> name="name" rules={[{ required: true }]}>
            <SealInput.Input
              label="Name"
              required
              style={{ width: INPUT_WIDTH.default }}
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<ProfileProps> name="email" rules={[{ required: true }]}>
            <SealInput.Input
              label="Email"
              required
              style={{ width: INPUT_WIDTH.default }}
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<ProfileProps>
            name="originalPassword"
            rules={[{ required: true }]}
          >
            <SealInput.Password
              label="Original Password"
              required
              style={{ width: INPUT_WIDTH.default }}
            ></SealInput.Password>
          </Form.Item>
          <Form.Item<ProfileProps> name="password" rules={[{ required: true }]}>
            <SealInput.Password
              label="Password"
              required
              style={{ width: INPUT_WIDTH.default }}
            ></SealInput.Password>
          </Form.Item>
        </Form>
        <FormButtons></FormButtons>
      </PageContainer>
    </StrictMode>
  );
};

export default Profile;
