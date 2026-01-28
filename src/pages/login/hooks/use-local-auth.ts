import { initialPasswordAtom } from '@/atoms/user';
import { clearStorageUserSettings } from '@/atoms/utils';
import {
  CRYPT_TEXT,
  REMEMBER_ME_KEY,
  getRememberMe,
  rememberMe,
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
  onError,
  form
}: UseLocalAuthOptions) => {
  const [initialPassword, setInitialPassword] = useAtom(initialPasswordAtom);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Encrypt password before storing
  const encryptPassword = (password: string) => {
    const psw = CryptoJS.AES?.encrypt?.(password, CRYPT_TEXT).toString();
    return psw;
  };

  const decryptPassword = (password: string) => {
    const bytes = CryptoJS.AES?.decrypt?.(password, CRYPT_TEXT);
    const res = bytes.toString(CryptoJS.enc.Utf8);
    return res;
  };

  const callGetRememberMe = async () => {
    const rememberMe = await getRememberMe(REMEMBER_ME_KEY);

    if (rememberMe?.f) {
      const username = decryptPassword(rememberMe?.um);
      const password = decryptPassword(rememberMe?.pw);
      form.setFieldsValue({ username, password, autoLogin: true });
    }
  };

  // remember me
  const callRememberMe = async (values: any) => {
    const { autoLogin } = values;
    if (autoLogin) {
      await rememberMe(REMEMBER_ME_KEY, {
        um: encryptPassword(values.username),
        pw: encryptPassword(values.password),
        f: true
      });
    } else {
      await removeRememberMe(REMEMBER_ME_KEY);
    }
  };

  // click login button
  const handleLogin = async (values: any) => {
    setSubmitLoading(true);
    try {
      await login({
        username: values.username,
        password: values.password
      });

      const userInfo = await fetchUserInfo();
      if (values.autoLogin) {
        await callRememberMe(values);
      } else {
        await removeRememberMe(REMEMBER_ME_KEY);
      }

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

  useEffect(() => {
    callGetRememberMe();
  }, []);

  return {
    handleLogin,
    submitLoading
  };
};
