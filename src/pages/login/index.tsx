import LogoIcon from '@/assets/images/logo.png';
import SealInput from '@/components/seal-form/seal-input';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Checkbox, Form } from 'antd';
import { flushSync } from 'react-dom';
import { login } from './apis';

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
  const { initialState, setInitialState } = useModel('@@initialState');

  const [form] = Form.useForm();

  const gotoDefaultPage = (userInfo: any) => {
    const pathname = userInfo?.is_admin ? '/dashboard' : '/playground';
    history.push(pathname);
  };
  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();

    if (userInfo) {
      flushSync(() => {
        setInitialState((s: any) => ({
          ...s,
          currentUser: userInfo
        }));
      });
    }
    return userInfo;
  };

  const handleLogin = async (values: any) => {
    console.log('values', values, form);
    try {
      await login({
        username: values.username,
        password: values.password
      });
      const userInfo = await fetchUserInfo();

      gotoDefaultPage(userInfo);
    } catch (error) {
      console.log('error====', error);
    }
  };

  return (
    <Form
      form={form}
      style={{ width: '400px', margin: '5% auto 0' }}
      onFinish={handleLogin}
    >
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
          <Checkbox>Remember me</Checkbox>
        </div>
      </Form.Item>
      <Button htmlType="submit" type="primary" block>
        Login
      </Button>
    </Form>
  );
};

export default Login;
