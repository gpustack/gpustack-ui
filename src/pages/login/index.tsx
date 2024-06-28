import { useState } from 'react';
import LoginForm from './components/login-form';

const Login = () => {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <div>
      <LoginForm setCurrentUser={setCurrentUser} />
      {/* <PasswordForm /> */}
    </div>
  );
};

export default Login;
