import LogoIcon from '@/assets/images/gpustack-logo.png';
import { initialPasswordAtom, userAtom } from '@/atoms/user';
import LangSelect from '@/components/lang-select';
import SealInput from '@/components/seal-form/seal-input';
import {
  getRememberMe,
  rememberMe,
  removeRememberMe
} from '@/utils/localstore/index';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useIntl, useModel } from '@umijs/max';
import { Button, Checkbox, Form } from 'antd';
import CryptoJS from 'crypto-js';
import { useAtom } from 'jotai';
import { memo, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { login } from '../apis';
import { checkDefaultPage } from '../utils';

const REMEMBER_ME_KEY = 'r_m';
const CRYPT_TEXT = 'seal';

const LoginForm = () => {
  const [userInfo, setUserInfo] = useAtom(userAtom);
  const [initialPassword, setInitialPassword] = useAtom(initialPasswordAtom);
  const { initialState, setInitialState } = useModel('@@initialState') || {};
  const intl = useIntl();
  const [form] = Form.useForm();

  console.log('initialState+++++++=login', userInfo, initialState);
  const renderWelCome = useMemo(() => {
    return (
      <div
        style={{
          display: 'flex',
          marginBottom: 32,
          fontSize: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div className="flex-center">
          <span>{intl?.formatMessage({ id: 'users.login.title' })}</span>
          <img
            src={LogoIcon}
            alt="logo"
            style={{ height: '24px', marginLeft: 10 }}
          />
        </div>
      </div>
    );
  }, [intl]);

  const gotoDefaultPage = async (userInfo: any) => {
    checkDefaultPage(userInfo, true);
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

  const encryptPassword = (password: string) => {
    const psw = CryptoJS.AES?.encrypt?.(password, CRYPT_TEXT).toString();
    return psw;
  };
  const decryptPassword = (password: string) => {
    const bytes = CryptoJS.AES?.decrypt?.(password, CRYPT_TEXT);
    const res = bytes.toString(CryptoJS.enc.Utf8);
    return res;
  };

  const callRememberMe = async (values: any) => {
    const { autoLogin } = values;
    if (autoLogin) {
      await rememberMe(REMEMBER_ME_KEY, {
        um: encryptPassword(values.username),
        pw: encryptPassword(values.password),
        f: true
      });
    } else {
      await removeRememberMe(REMEMBER_ME_KEY);
    }
  };

  const callGetRememberMe = async () => {
    const rememberMe = await getRememberMe(REMEMBER_ME_KEY);

    if (rememberMe?.f) {
      const username = decryptPassword(rememberMe?.um);
      const password = decryptPassword(rememberMe?.pw);
      form.setFieldsValue({ username, password, autoLogin: true });
    }
  };

  const handleLogin = async (values: any) => {
    try {
      await login({
        username: values.username,
        password: values.password
      });

      const userInfo = await fetchUserInfo();
      setUserInfo(userInfo);
      if (values.autoLogin) {
        await callRememberMe(values);
      } else {
        await removeRememberMe(REMEMBER_ME_KEY);
      }
      if (!userInfo?.require_password_change) {
        gotoDefaultPage(userInfo);
      } else {
        setInitialPassword(encryptPassword(values.password));
      }
    } catch (error) {
      // to do something
    }
  };

  useEffect(() => {
    callGetRememberMe();
  }, []);

  return (
    <div>
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          padding: '20px'
        }}
      >
        <LangSelect />
      </div>
      <div>
        <Form
          form={form}
          style={{ width: '400px', margin: '0 auto' }}
          onFinish={handleLogin}
        >
          {renderWelCome}
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
          <Form.Item noStyle name="autoLogin" valuePropName="checked">
            <Checkbox style={{ marginLeft: 5, marginBottom: 16 }}>
              <span style={{ color: 'var(--ant-color-text-secondary)' }}>
                {' '}
                {intl.formatMessage({ id: 'common.login.rember' })}
              </span>
            </Checkbox>
          </Form.Item>
          <Button
            htmlType="submit"
            type="primary"
            block
            style={{ height: '48px', fontSize: '14px' }}
          >
            {intl.formatMessage({ id: 'common.button.login' })}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default memo(LoginForm);
