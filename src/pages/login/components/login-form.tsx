import LogoIcon from '@/assets/images/gpustack-logo.png';
import { userAtom } from '@/atoms/user';
import LangSelect from '@/components/lang-select';
import ThemeDropActions from '@/components/theme-toggle/theme-drop-actions';
import { useIntl, useModel } from '@umijs/max';
import { Button, Divider, Form, Spin, message } from 'antd';
import { createStyles } from 'antd-style';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import styled from 'styled-components';
import { useLocalAuth } from '../hooks/use-local-auth';
import { useSSOAuth } from '../hooks/use-sso-auth';
import { checkDefaultPage } from '../utils';
import LocalUserForm from './local-user-form';

const Buttons = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 24px;
  width: 360px;
`;

const BackButton = styled(Button).attrs({
  type: 'link',
  size: 'small',
  block: true
})`
  margin-top: 20px;
`;

const ButtonWrapper = styled(Button).attrs({
  type: 'primary',
  block: true
})`
  height: 48px;
`;

const ButtonText = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
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
  `,
  welcome: css`
    display: flex;
    margin-bottom: 32px;
    font-size: 20px;
    justify-content: center;
    align-items: center;
    .text {
      color: ${token.colorText};
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
  const [isPassword, setIsPassword] = useState(false);

  const renderWelCome = () => {
    return (
      <div className={styles.welcome}>
        <div className="flex-center">
          <span className="text">
            {intl?.formatMessage({ id: 'users.login.title' })}
          </span>
          <img
            src={LogoIcon}
            alt="logo"
            style={{ height: '24px', marginLeft: 10 }}
          />
        </div>
      </div>
    );
  };

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

  const handleLoginWithPassword = () => {
    setIsPassword(true);
  };

  const handleLoginWithThirdParty = () => {
    if (SSOAuth.options.oidc) {
      SSOAuth.loginWithOIDC();
    } else if (SSOAuth.options.saml) {
      SSOAuth.loginWithSAML();
    }
  };

  const hasThirdPartyLogin = useMemo(() => {
    return SSOAuth.options.oidc || SSOAuth.options.saml;
  }, [SSOAuth.options]);

  const renderLoginButtons = () => {
    // do not render login buttons if using password login or no third-party login
    if (!hasThirdPartyLogin || isPassword) return null;

    return (
      <Buttons>
        {SSOAuth.options.oidc && (
          <ButtonWrapper onClick={SSOAuth.loginWithOIDC}>
            <ButtonText>
              {intl.formatMessage(
                { id: 'common.external.login' },
                { type: 'OIDC' }
              )}
            </ButtonText>
          </ButtonWrapper>
        )}
        {SSOAuth.options.saml && (
          <ButtonWrapper onClick={SSOAuth.loginWithSAML}>
            <ButtonText>
              {intl.formatMessage(
                { id: 'common.external.login' },
                { type: 'SAML' }
              )}
            </ButtonText>
          </ButtonWrapper>
        )}
        <Button type="link" block onClick={handleLoginWithPassword}>
          <ButtonText>
            {intl.formatMessage({ id: 'common.login.password' })}
          </ButtonText>
        </Button>
      </Buttons>
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
          <>
            {renderWelCome()}
            {renderLoginButtons()}
            {(!hasThirdPartyLogin || isPassword) && (
              <LocalUserForm handleLogin={handleLogin} form={form} />
            )}
            {hasThirdPartyLogin && isPassword && (
              <BackButton onClick={handleLoginWithThirdParty}>
                {intl.formatMessage(
                  { id: 'common.external.login' },
                  { type: SSOAuth.options.oidc ? 'OIDC' : 'SAML' }
                )}
              </BackButton>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
