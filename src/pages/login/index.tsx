import { userAtom } from '@/atoms/user';
import { history } from '@umijs/max';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import LoginForm from './components/login-form';
import PasswordForm from './components/password-form';

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

  return (
    <div>
      {userInfo?.require_password_change ? <PasswordForm /> : <LoginForm />}
    </div>
  );
};

export default Login;
