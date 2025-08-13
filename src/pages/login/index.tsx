import Bg2 from '@/assets/images/bg-2.png';
import { userAtom } from '@/atoms/user';
import DarkMask from '@/components/dark-mask';
import Footer from '@/components/footer';
import useUserSettings from '@/hooks/use-user-settings';
import { useModel } from '@umijs/max';
import { ConfigProvider, theme } from 'antd';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import styled from 'styled-components';
import LoginForm from './components/login-form';
import PasswordForm from './components/password-form';
import { checkDefaultPage } from './utils';

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
  padding-top: 10%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const FormWrapper = styled.div`
  position: relative;
  margin: 0 auto;
  border-radius: var(--border-radius-modal);
  width: max-content;
  height: max-content;
  max-width: 800px;
  max-height: 600px;
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

const Login = () => {
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
      <div>
        <DarkMask></DarkMask>
        <Wrapper $isDarkTheme={isDarkTheme}></Wrapper>
        <Box>
          <FormWrapper>
            {userInfo?.require_password_change ? (
              <PasswordForm />
            ) : (
              <LoginForm />
            )}
          </FormWrapper>
          <Footer />
        </Box>
      </div>
    </ConfigProvider>
  );
};

export default Login;
