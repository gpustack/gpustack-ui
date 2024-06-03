import LogoIcon from '@/assets/images/logo.png';
import SealInput from '@/components/seal-form/seal-input';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form } from 'antd';

const renderLogo = () => {
  return (
    <div
      style={{
        width: '400px',
        display: 'flex',
        marginBottom: 24,
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <img src={LogoIcon} alt="logo" style={{ width: '44px' }} />
      <span style={{ fontSize: 34, marginLeft: 12 }}>SEAL</span>
    </div>
  );
};
const Login = () => {
  return (
    <Form style={{ width: '400px', margin: '5% auto 0' }}>
      <div>{renderLogo()}</div>
      <Form.Item
        name="username"
        rules={[
          {
            required: true,
            message: 'Please input your Username!'
          }
        ]}
      >
        <SealInput.Input label="Username" prefix={<UserOutlined />} />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: 'Please input your Password!'
          }
        ]}
      >
        <SealInput.Password prefix={<LockOutlined />} label="Password" />
      </Form.Item>
      <Form.Item name="autoLogin">
        <div style={{ paddingLeft: 10 }}>
          <Checkbox>Auto login</Checkbox>
        </div>
      </Form.Item>
      <Button htmlType="submit" type="primary" block>
        Login
      </Button>
    </Form>
  );
};

export default Login;
