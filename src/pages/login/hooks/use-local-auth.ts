import { initialPasswordAtom } from '@/atoms/user';
import { clearStorageUserSettings } from '@/atoms/utils';
import {
  CRYPT_TEXT,
  REMEMBER_ME_KEY,
  removeRememberMe
} from '@/utils/localstore/index';
import { FormInstance } from 'antd';
import CryptoJS from 'crypto-js';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { login } from '../apis';

interface UseLocalAuthOptions {
  fetchUserInfo: () => Promise<any>;
  onSuccess?: (userInfo: any) => void;
  onError?: (error: Error) => void;
  form: FormInstance;
}

export const useLocalAuth = ({
  fetchUserInfo,
  onSuccess,
  onError
}: UseLocalAuthOptions) => {
  const [initialPassword, setInitialPassword] = useAtom(initialPasswordAtom);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Encrypt password before storing
  const encryptPassword = (password: string) => {
    const psw = CryptoJS.AES?.encrypt?.(password, CRYPT_TEXT).toString();
    return psw;
  };

  useEffect(() => {
    removeRememberMe(REMEMBER_ME_KEY);
  }, []);

  // click login button
  const handleLogin = async (values: any) => {
    setSubmitLoading(true);
    try {
      await login({
        username: values.username,
        password: values.password
      });

      const userInfo = await fetchUserInfo();
      console.log('autoLogin', values.autoLogin);

      if (userInfo?.require_password_change) {
        setInitialPassword(encryptPassword(values.password));
      }
      clearStorageUserSettings();
      onSuccess?.(userInfo);
    } catch (error: any) {
      onError?.(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return {
    handleLogin,
    submitLoading
  };
};
