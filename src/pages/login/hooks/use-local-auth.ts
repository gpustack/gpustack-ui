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

      // Stash the credential BEFORE `fetchUserInfo`, not after: that call
      // commits the identity — `require_password_change` included — to
      // `userAtom` from `app.tsx`, and React renders on the awaits that
      // follow. Writing it afterwards leaves a window where the flag is
      // set with no credential behind it, which is exactly the state
      // `useInitialPasswordGuard` treats as unrecoverable — it would log
      // the user out mid-login, every login. Whether it is needed is only
      // known once the response lands, so store optimistically and drop
      // it below.
      setInitialPassword(encryptPassword(values.password));

      const userInfo = await fetchUserInfo();
      console.log('autoLogin', values.autoLogin);

      if (!userInfo?.require_password_change) {
        setInitialPassword('');
      }
      clearStorageUserSettings();
      onSuccess?.(userInfo);
    } catch (error: any) {
      // Includes the optimistic stash above — a login that never
      // completed has no forced-change form to feed.
      setInitialPassword('');
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
