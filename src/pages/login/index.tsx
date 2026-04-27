import LogoIcon from '@/assets/images/gpustack-logo.png';
import { initialPasswordAtom, userAtom } from '@/atoms/user';
import { resetStorageUserSettings } from '@/atoms/utils';
import DarkMask from '@/components/dark-mask';
import Footer from '@/components/footer';
import LangSelect from '@/components/lang-select';
import ThemeDropActions from '@/components/theme-toggle/theme-drop-actions';
import { PasswordReg } from '@/config';
import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import { COLOR_PRIMARY } from '@/config/theme/constants';
import externalLinks from '@/constants/external-links';
import useUserSettings from '@/hooks/use-user-settings';
import useUserSettingsStorage from '@/hooks/use-user-settings-storage';
import { getGPUStackPlugin } from '@/plugins';
import {
  CRYPT_TEXT,
  IS_FIRST_LOGIN,
  writeState
} from '@/utils/localstore/index';
import { CoreUIProvider } from '@gpustack/core-ui';
import {
  getAllLocales,
  request,
  setLocale,
  useIntl,
  useModel,
  useNavigate
} from '@umijs/max';
import { ConfigProvider, theme } from 'antd';
import { createStyles } from 'antd-style';
import CryptoJS from 'crypto-js';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import styled from 'styled-components';
import { updatePassword as updatePasswordApi } from './apis';
import Background from './components/background';
import LoginForm from './components/login-form';
import PasswordForm from './components/password-form';
import { useLocalAuth } from './hooks/use-local-auth';
import { useSSOAuth } from './hooks/use-sso-auth';
import { checkDefaultPage } from './utils';

const COLOR_LINK = '#1677ff';

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
    z-index: 100;
    .anticon-global {
      color: ${token.colorText};
    }
    .anticon:hover {
      color: ${token.colorTextTertiary};
    }
  `,
  formContainer: css`
    height: calc(100vh - 64px);
    width: 100%;
  `
}));

const Box = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const FormWrapper = styled.div`
  margin: 0 auto;
  margin-top: 50vh;
  max-width: 440px;
  transform: translateY(-50%);
  position: relative;
  z-index: 999;
  border-radius: var(--border-radius-modal);
  width: max-content;
  height: max-content;
  max-height: 660px;
  padding: 40px;
  background-color: var(--color-modal-content-bg);
  box-shadow: var(--color-modal-box-shadow);
  .field-wrapper {
    background-color: transparent !important;
  }

  .ant-input-outlined.ant-input-status-error:not(.ant-input-disabled) {
    background-color: transparent !important;
  }
`;

const decryptInitialPassword = (password: string) => {
  const bytes = CryptoJS.AES?.decrypt?.(password, CRYPT_TEXT);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const Login = () => {
  const { styles } = useStyles();
  const intl = useIntl();
  const navigate = useNavigate();
  const userSettingsStorage = useUserSettingsStorage();
  const { themeData, userSettings, isDarkTheme } = useUserSettings();
  const [userInfo, setUserInfo] = useAtom(userAtom);
  const [initialPassword, setInitialPassword] = useAtom(initialPasswordAtom);
  const { initialState, setInitialState } = useModel('@@initialState') || {};

  const enterprisePlugin = getGPUStackPlugin();

  const CustomLoginComponent = enterprisePlugin?.login?.CustomLoginComponent;
  const shouldUseCustomLogin = enterprisePlugin?.login?.shouldUseCustomLogin;

  const useCustomLogin = useMemo(
    () => shouldUseCustomLogin?.(userSettings),
    [shouldUseCustomLogin, userSettings]
  );

  console.log('useCustomLogin', useCustomLogin, userSettings);

  const gotoDefaultPage = async (info: any) => {
    if (!info || info?.require_password_change) {
      return;
    }

    checkDefaultPage(info, true);
    if (!initialState?.currentUser) {
      setInitialState((preState: any) => ({
        ...preState,
        currentUser: info
      }));
    }
  };

  useEffect(() => {
    gotoDefaultPage(userInfo);
  }, [userInfo]);

  const fetchUserInfo = useCallback(async () => {
    const info = await initialState?.fetchUserInfo?.();
    if (info) {
      flushSync(() => {
        setInitialState((s: any) => ({
          ...s,
          currentUser: info
        }));
      });
    }
    return info;
  }, [initialState, setInitialState]);

  const onPasswordChanged = useCallback(() => {
    resetStorageUserSettings();
    writeState(IS_FIRST_LOGIN, null);
  }, []);

  const kit = useMemo(
    () => ({
      useLocalAuth,
      useSSOAuth,
      userInfo,
      setUserInfo,
      fetchUserInfo,
      checkDefaultPage,
      initialPassword,
      setInitialPassword,
      decryptInitialPassword,
      updatePassword: updatePasswordApi,
      passwordReg: PasswordReg,
      onPasswordChanged,
      resetPasswordUrl: externalLinks.resetPassword,
      formLogoUrl: LogoIcon
    }),
    [
      userInfo,
      setUserInfo,
      fetchUserInfo,
      initialPassword,
      setInitialPassword,
      onPasswordChanged
    ]
  );
  return (
    <ConfigProvider
      componentSize="large"
      theme={{
        algorithm: userSettings.isDarkTheme
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,
        ...themeData,
        token: {
          ...themeData?.token,
          colorPrimary:
            enterprisePlugin?.getPrimaryColor?.(userSettings)?.colorPrimary ||
            COLOR_PRIMARY
        }
      }}
    >
      <CoreUIProvider
        config={{
          apiBaseUrl: GPUSTACK_API_BASE_URL,
          theme: userSettings.theme,
          isDarkTheme: userSettings.isDarkTheme,
          defaultColorPrimary: COLOR_PRIMARY
        }}
        hooks={{
          useUserSettings: useUserSettings as any,
          useUserSettingsStorage: () => userSettingsStorage,
          useIntl: useIntl
        }}
        i18n={intl}
        locale={{
          getAllLocales: getAllLocales,
          setLocale: setLocale
        }}
        services={{
          request: request,
          router: {
            push: (path: string) => navigate(path),
            replace: (path: string) => navigate(path, { replace: true }),
            goBack: () => navigate(-1)
          }
        }}
      >
        <div className={styles.header}>
          <ThemeDropActions></ThemeDropActions>
          <LangSelect />
        </div>
        <DarkMask></DarkMask>
        <Background isDarkTheme={isDarkTheme} />
        {useCustomLogin && CustomLoginComponent ? (
          <CustomLoginComponent kit={kit} />
        ) : (
          <Box>
            <div className={styles.formContainer}>
              <FormWrapper>
                {userInfo?.require_password_change ? (
                  <PasswordForm />
                ) : (
                  <LoginForm />
                )}
              </FormWrapper>
            </div>
            <Footer />
          </Box>
        )}
      </CoreUIProvider>
    </ConfigProvider>
  );
};

export default Login;
