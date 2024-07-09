import { userAtom } from '@/atoms/user';
import Footer from '@/components/footer';
import { history } from '@umijs/max';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import LoginForm from './components/login-form';
import PasswordForm from './components/password-form';
import styles from './components/styles.less';

const Login = () => {
  const [userInfo, setUserInfo] = useAtom(userAtom);

  const gotoDefaultPage = (userInfo: any) => {
    if (!userInfo || userInfo?.require_password_change) {
      return;
    }
    const pathname = userInfo?.is_admin ? '/dashboard' : '/playground';

    history.push(pathname, { replace: true });
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
