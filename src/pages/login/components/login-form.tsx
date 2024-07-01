import LogoIcon from '@/assets/images/logo.png';
import { initialPasswordAtom, userAtom } from '@/atoms/user';
import SealInput from '@/components/seal-form/seal-input';
import { GlobalOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { SelectLang, history, useIntl, useModel } from '@umijs/max';
import { Button, Checkbox, Form } from 'antd';
import { useAtom } from 'jotai';
import { flushSync } from 'react-dom';
import { login } from '../apis';

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
const LoginForm = () => {
  const [userInfo, setUserInfo] = useAtom(userAtom);
  const [initialPassword, setInitialPassword] = useAtom(initialPasswordAtom);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { globalState, setGlobalState } = useModel('global');
  const intl = useIntl();
  const [form] = Form.useForm();

  const gotoDefaultPage = (userInfo: any) => {
    const pathname =
      userInfo && userInfo?.is_admin ? '/dashboard' : '/playground';
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
      setGlobalState({
        userInfo
      });
      setUserInfo(userInfo);
      setInitialPassword(values.password);
      if (!userInfo?.require_password_change) {
        gotoDefaultPage(userInfo);
      }
      // gotoDefaultPage(userInfo);
    } catch (error) {
      console.log('error====', error);
    }
  };

  return (
    <div>
      <div style={{ position: 'fixed', right: 0, top: 0, padding: '0 20px' }}>
        <SelectLang icon={<GlobalOutlined />} reload={false} />
      </div>
      <Form
        form={form}
        style={{ width: '400px', margin: '0 auto', paddingTop: '5%' }}
        onFinish={handleLogin}
      >
        <div>{renderLogo()}</div>
        <Form.Item
          name="username"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                { name: intl.formatMessage({ id: 'common.form.username' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'common.form.username' })}
            prefix={<UserOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                { name: intl.formatMessage({ id: 'common.form.password' }) }
              )
            }
          ]}
        >
          <SealInput.Password
            prefix={<LockOutlined />}
            label={intl.formatMessage({ id: 'common.form.password' })}
          />
        </Form.Item>
        <Form.Item name="autoLogin">
          <div style={{ paddingLeft: 10 }}>
            <Checkbox>
              {intl.formatMessage({ id: 'common.login.rember' })}
            </Checkbox>
          </div>
        </Form.Item>
        <Button htmlType="submit" type="primary" block>
          {intl.formatMessage({ id: 'menu.login' })}
        </Button>
      </Form>
    </div>
  );
};

export default LoginForm;
