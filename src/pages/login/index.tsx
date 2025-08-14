import Bg2 from '@/assets/images/bg-2.png';
import { userAtom } from '@/atoms/user';
import DarkMask from '@/components/dark-mask';
import Footer from '@/components/footer';
import LangSelect from '@/components/lang-select';
import ThemeDropActions from '@/components/theme-toggle/theme-drop-actions';
import useUserSettings from '@/hooks/use-user-settings';
import { useModel } from '@umijs/max';
import { ConfigProvider, theme } from 'antd';
import { createStyles } from 'antd-style';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import styled from 'styled-components';
import LoginForm from './components/login-form';
import PasswordForm from './components/password-form';
import { checkDefaultPage } from './utils';

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
  formContainer: css`
    height: calc(100vh - 64px);
    width: 100%;
  `
}));

const Wrapper = styled.div<{ $isDarkTheme: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  min-height: 100vh;
  z-index: -1;
  background: ${({ $isDarkTheme }) =>
    $isDarkTheme
      ? `radial-gradient(at 50% 20%, #383838 0%, #292929 40%, #000 100%)`
      : `url(${Bg2}) center center no-repeat`};
  background-size: ${({ $isDarkTheme }) =>
    $isDarkTheme ? 'contain' : 'cover'};
  opacity: ${({ $isDarkTheme }) => ($isDarkTheme ? 1 : 0.6)};
`;

const Box = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const FormWrapper = styled.div`
  position: relative;
  margin: 0 auto;
  z-index: 999;
  border-radius: var(--border-radius-modal);
  width: max-content;
  height: max-content;
  max-width: 800px;
  max-height: 600px;
  padding: 40px;
  background-color: var(--color-modal-content-bg);
  box-shadow: var(--color-modal-box-shadow);
  margin-top: 50vh;
  transform: translateY(-50%);
  .field-wrapper {
    background-color: transparent !important;
  }

  .ant-input-outlined.ant-input-status-error:not(.ant-input-disabled) {
    background-color: transparent !important;
  }
`;

const Login = () => {
  const { styles } = useStyles();
  const { themeData, userSettings, isDarkTheme } = useUserSettings();
  const [userInfo, setUserInfo] = useAtom(userAtom);
  const { initialState, setInitialState } = useModel('@@initialState') || {};

  const gotoDefaultPage = async (userInfo: any) => {
    if (!userInfo || userInfo?.require_password_change) {
      return;
    }

    checkDefaultPage(userInfo, true);
    if (!initialState?.currentUser) {
      setInitialState((preState: any) => ({
        ...preState,
        currentUser: userInfo
      }));
    }
  };

  useEffect(() => {
    gotoDefaultPage(userInfo);
  }, [userInfo]);

  useEffect(() => {
    document.title = 'GPUStack';
  }, []);

  return (
    <ConfigProvider
      componentSize="large"
      key={userSettings.colorPrimary}
      theme={{
        algorithm: userSettings.isDarkTheme
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,
        ...themeData
      }}
    >
      <div className={styles.header}>
        <ThemeDropActions></ThemeDropActions>
        <LangSelect />
      </div>
      <DarkMask></DarkMask>
      <Wrapper $isDarkTheme={isDarkTheme}></Wrapper>
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
    </ConfigProvider>
  );
};

export default Login;
