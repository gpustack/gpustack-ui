import LogoIcon from '@/assets/images/gpustack-logo.png';
import OIDCIcon from '@/assets/images/oidc.svg';
import SAMLIcon from '@/assets/images/saml.svg';
import { userAtom } from '@/atoms/user';
import LangSelect from '@/components/lang-select';
import SealInput from '@/components/seal-form/seal-input';
import ThemeDropActions from '@/components/theme-toggle/theme-drop-actions';
import externalLinks from '@/constants/external-links';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useIntl, useModel } from '@umijs/max';
import { Button, Checkbox, Divider, Form, Spin, Tooltip, message } from 'antd';
import { createStyles } from 'antd-style';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import styled from 'styled-components';
import { useLocalAuth } from '../hooks/use-local-auth';
import { useSSOAuth } from '../hooks/use-sso-auth';
import { checkDefaultPage } from '../utils';

const Buttons = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
`;

const ButtonWrapper = styled(Button).attrs({
  shape: 'circle',
  size: 'large',
  color: 'default',
  variant: 'filled'
})`
  height: 42px;
  width: 42px;
`;

const DividerWrapper = styled(Divider)`
  margin-block: 24px !important;
  .ant-divider-inner-text {
    color: var(--ant-color-text-secondary);
  }
`;

const useStyles = createStyles(({ token, css }) => ({
  header: css`
    display: flex;
    align-items: center;
    gap: 8px;
    position: fixed;
    right: 0;
    top: 0;
    height: 60px;
    padding: 20px;
    .anticon-global {
      color: ${token.colorText};
    }
    .anticon:hover {
      color: ${token.colorTextTertiary};
    }
  `,
  errorMessage: css`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    color: ${token.colorText};
    .title {
      font-weight: bold;
    }
  `
}));

const LoginForm = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const { styles } = useStyles();
  const [userInfo, setUserInfo] = useAtom(userAtom);
  const { initialState, setInitialState } = useModel('@@initialState') || {};
  const [authError, setAuthError] = useState<Error | null>(null);
  const intl = useIntl();
  const [form] = Form.useForm();

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

  // error handling for authentication
  const handleOnError = (error: Error) => {
    setAuthError(error);
    messageApi.error({
      duration: 5,
      content: (
        <div className={styles.errorMessage}>
          <div className="title">
            {intl.formatMessage({ id: 'common.login.auth.failed' })}
          </div>
          <div className="message">{error?.message || 'Unknown error'}</div>
        </div>
      )
    });
  };

  // local user authentication
  const { handleLogin } = useLocalAuth({
    fetchUserInfo,
    form,
    onSuccess: async (userInfo) => {
      setUserInfo(userInfo);
      if (!userInfo?.require_password_change) {
        gotoDefaultPage(userInfo);
      }
    },
    onError: (error) => {
      // gpustack handle in the interceptor
    }
  });

  // SSO hook
  const SSOAuth = useSSOAuth({
    fetchUserInfo,
    onSuccess: (userInfo) => {
      setUserInfo(userInfo);
      gotoDefaultPage({});
    },
    onError: handleOnError
  });

  const hasThirdPartyLogin = useMemo(() => {
    return SSOAuth.options.oidc || SSOAuth.options.saml;
  }, [SSOAuth.options]);

  const renderThirdPartyLoginButtons = () => {
    if (!hasThirdPartyLogin) return null;
    return (
      <>
        <DividerWrapper plain>
          {intl.formatMessage({ id: 'common.login.thirdparty' })}
        </DividerWrapper>
        <Buttons>
          {SSOAuth.options.oidc && (
            <Tooltip title="OIDC">
              <ButtonWrapper onClick={SSOAuth.loginWithOIDC}>
                <img src={OIDCIcon} alt="" height={32} width={32} />
              </ButtonWrapper>
            </Tooltip>
          )}
          {SSOAuth.options.saml && (
            <Tooltip title="SAML">
              <ButtonWrapper onClick={SSOAuth.loginWithSAML}>
                <img src={SAMLIcon} alt="" height={32} width={32} />
              </ButtonWrapper>
            </Tooltip>
          )}
        </Buttons>
      </>
    );
  };

  const isThirdPartyAuthHandling = useMemo(() => {
    return SSOAuth.isSSOLogin && !authError;
  }, [SSOAuth.isSSOLogin, authError]);

  return (
    <div>
      {contextHolder}
      <div className={styles.header}>
        <ThemeDropActions></ThemeDropActions>
        <LangSelect />
      </div>
      <div>
        {isThirdPartyAuthHandling ? (
          <Spin>
            <span style={{ color: 'var(--ant-color-text)' }}>
              {intl.formatMessage({ id: 'common.login.auth' })}
            </span>
          </Spin>
        ) : (
          <Form
            form={form}
            style={{ width: '360px', margin: '0 auto' }}
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
                    {
                      name: intl.formatMessage({ id: 'common.form.username' })
                    }
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
                    {
                      name: intl.formatMessage({ id: 'common.form.password' })
                    }
                  )
                }
              ]}
            >
              <SealInput.Password
                prefix={<LockOutlined />}
                label={intl.formatMessage({ id: 'common.form.password' })}
              />
            </Form.Item>
            <div
              className="flex-center flex-between"
              style={{
                marginBottom: 24
              }}
            >
              <Form.Item noStyle name="autoLogin" valuePropName="checked">
                <Checkbox style={{ marginLeft: 5 }}>
                  <span style={{ color: 'var(--ant-color-text-secondary)' }}>
                    {intl.formatMessage({ id: 'common.login.rember' })}
                  </span>
                </Checkbox>
              </Form.Item>
              <Button
                type="link"
                size="small"
                href={externalLinks.resetPassword}
                target="_blank"
                style={{ padding: 0 }}
              >
                {intl.formatMessage({ id: 'common.button.forgotpassword' })}
              </Button>
            </div>
            <Button
              htmlType="submit"
              type="primary"
              block
              style={{ height: '48px', fontSize: '14px' }}
            >
              {intl.formatMessage({ id: 'common.button.login' })}
            </Button>
            {renderThirdPartyLoginButtons()}
          </Form>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
