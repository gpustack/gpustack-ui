// hooks/useSSOAuth.ts
import { history } from '@umijs/max';
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
  onError
}: {
  fetchUserInfo: () => Promise<any>;
  onSuccess?: (userInfo: any) => void;
  onError?: (err: Error) => void;
}) {
  const [loginOption, setLoginOption] = useState<LoginOption>({
    saml: false,
    oidc: false
  });

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
      const authConfig = await fetchAuthConfig('/auth_config');
      setLoginOption({
        oidc: !!authConfig.is_oidc,
        saml: !!authConfig.is_saml
      });
      if (sso) {
        if (authConfig.is_oidc) {
          oidcLogin();
        } else if (authConfig.is_saml) {
          samlLogin();
        } else {
          onError?.(new Error('No SSO configuration found'));
        }
      }
    } catch (error: any) {
      setLoginOption({ oidc: false, saml: false });
      onError?.(error);
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
