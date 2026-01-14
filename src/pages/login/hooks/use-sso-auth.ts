// hooks/useSSOAuth.ts
import { history, useIntl } from '@umijs/max';
import { useEffect, useState } from 'react';
import {
  AUTH_OIDC_LOGIN_API,
  AUTH_SAML_LOGIN_API,
  fetchAuthConfig
} from '../apis';

type LoginOption = {
  saml: boolean;
  oidc: boolean;
  first_time_setup: boolean;
  get_initial_password_command: string;
};

export function useSSOAuth({
  fetchUserInfo,
  onSuccess,
  onLoading,
  onError
}: {
  fetchUserInfo: () => Promise<any>;
  onSuccess?: (userInfo: any) => void;
  onError?: (err: Error) => void;
  onLoading?: (loading: boolean) => void;
}) {
  const [loginOption, setLoginOption] = useState<LoginOption>({
    saml: false,
    oidc: false,
    first_time_setup: false,
    get_initial_password_command: ''
  });

  const intl = useIntl();

  const { location } = history;
  const params = new URLSearchParams(location.search);
  const sso = params.get('sso');

  const oidcLogin = () => {
    window.location.href = AUTH_OIDC_LOGIN_API;
  };

  const samlLogin = () => {
    window.location.href = AUTH_SAML_LOGIN_API;
  };

  const init = async () => {
    try {
      const { is_oidc, is_saml, ...rest } = await fetchAuthConfig();
      setLoginOption({
        ...rest,
        oidc: !!is_oidc,
        saml: !!is_saml
      });
      if (sso) {
        onLoading?.(true);
        if (is_oidc) {
          oidcLogin();
        } else if (is_saml) {
          samlLogin();
        } else {
          onError?.(
            new Error(intl.formatMessage({ id: 'common.sso.noConfig' }))
          );
        }
      }
    } catch (error: any) {
      setLoginOption({
        oidc: false,
        saml: false,
        first_time_setup: false,
        get_initial_password_command: ''
      });
      onLoading?.(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  return {
    isSSOLogin: !!sso,
    options: loginOption,
    loginWithOIDC: oidcLogin,
    loginWithSAML: samlLogin
  };
}
