// hooks/useSSOAuth.ts
import { history, useIntl } from '@umijs/max';
import { useEffect, useState } from 'react';

type LoginOption = {
  saml: boolean;
  oidc: boolean;
};

// sso configuration
async function fetchAuthConfig(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('OIDC config error:', error);
    throw error;
  }
}

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
    oidc: false
  });

  const intl = useIntl();

  const { location } = history;
  const params = new URLSearchParams(location.search);
  const sso = params.get('sso');

  const oidcLogin = () => {
    window.location.href = '/auth/oidc/login';
  };

  const samlLogin = () => {
    window.location.href = '/auth/saml/login';
  };

  const init = async () => {
    try {
      const authConfig = await fetchAuthConfig('/auth-config');
      setLoginOption({
        oidc: !!authConfig.is_oidc,
        saml: !!authConfig.is_saml
      });
      if (sso) {
        onLoading?.(true);
        if (authConfig.is_oidc) {
          oidcLogin();
        } else if (authConfig.is_saml) {
          samlLogin();
        } else {
          onError?.(
            new Error(intl.formatMessage({ id: 'common.sso.noConfig' }))
          );
        }
      }
    } catch (error: any) {
      setLoginOption({ oidc: false, saml: false });
      onError?.(error);
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
