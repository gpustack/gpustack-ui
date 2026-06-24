// hooks/useSSOAuth.ts
import { history, useIntl } from '@umijs/max';
import { useEffect, useState } from 'react';
import { ExternalAuth, fetchAuthConfig } from '../apis';

type LoginOption = {
  // Active external auth provider, or ``null`` when only local login is
  // configured. Drives the SSO button: when set, render a button that
  // navigates to ``external_auth.login_url``.
  external_auth: ExternalAuth | null;
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
    external_auth: null,
    first_time_setup: false,
    get_initial_password_command: ''
  });

  const intl = useIntl();

  const { location } = history;
  const params = new URLSearchParams(location.search);
  const sso = params.get('sso');

  const loginWithExternalAuth = (auth: ExternalAuth | null) => {
    if (auth) {
      window.location.href = auth.login_url;
    }
  };

  const init = async () => {
    try {
      const { external_auth, ...rest } = await fetchAuthConfig();
      setLoginOption({
        ...rest,
        external_auth: external_auth ?? null
      });
      if (sso) {
        onLoading?.(true);
        if (external_auth) {
          loginWithExternalAuth(external_auth);
        } else {
          // ``?sso`` deep-link landed on a server with no external auth
          // configured. Surface the error AND release the loading
          // state — otherwise the form is stuck on the spinner.
          onLoading?.(false);
          onError?.(
            new Error(intl.formatMessage({ id: 'common.sso.noConfig' }))
          );
        }
      }
    } catch (error: any) {
      setLoginOption({
        external_auth: null,
        first_time_setup: false,
        get_initial_password_command: ''
      });
      onLoading?.(false);
      // ``fetchAuthConfig`` failed (network, server 5xx, …). Without
      // propagating, the login UI silently falls back to local-only —
      // which can mask a real ``?sso`` redirect failure.
      onError?.(error);
    }
  };

  useEffect(() => {
    init();
  }, []);

  return {
    isSSOLogin: !!sso,
    options: loginOption,
    loginWithExternalAuth: () =>
      loginWithExternalAuth(loginOption.external_auth)
  };
}
