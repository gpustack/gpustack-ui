import { userAtom } from '@/atoms/user';
import Footer from '@/components/footer';
import { useModel } from '@umijs/max';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import LoginForm from './components/login-form';
import PasswordForm from './components/password-form';
import styles from './components/styles.less';
import { checkDefaultPage } from './utils';

const Login = () => {
  const [userInfo, setUserInfo] = useAtom(userAtom);
  const { initialState, setInitialState } = useModel('@@initialState') || {};

  const gotoDefaultPage = async (userInfo: any) => {
    if (!userInfo || userInfo?.require_password_change) {
      return;
    }

    checkDefaultPage(userInfo, true);
    if (!initialState?.currentUser) {
      setInitialState((s: any) => ({
        ...s,
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
    <>
      <div className="login-wrapper"></div>
      <div className={styles.box}>
        <div className={styles['login-form-wrapper']}>
          {userInfo?.require_password_change ? <PasswordForm /> : <LoginForm />}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Login;
