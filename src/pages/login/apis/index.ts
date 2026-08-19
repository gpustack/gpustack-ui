import { hideModalTemporarilyAtom } from '@/atoms/settings';
import { systemConfigAtom } from '@/atoms/system';
import { initialPasswordAtom, userAtom } from '@/atoms/user';
import {
  clearAtomStorage,
  clearStorageUserSettings,
  setAtomStorage
} from '@/atoms/utils';
import { request } from '@umijs/max';
import qs from 'query-string';

export const AUTH_API = '/auth';

export const AUTH_CONFIG_API = '/auth/config';

export const login = async (
  params: { username: string; password: string },
  options?: any
) => {
  return request(`${AUTH_API}/login`, {
    method: 'POST',
    data: qs.stringify(params),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

export const logout = async (userInfo?: any) => {
  let res: any;
  try {
    res = await request(`${AUTH_API}/logout`, {
      method: 'POST'
    });
  } catch {
    // Offline, 5xx, session already gone — swallow it. The caller asked to
    // leave, and a half-done logout is worse than a stale server session:
    // rejecting here skips the caller's `navigate(loginPath)` and strands
    // the user on a page whose identity was just cleared. The request layer
    // has already surfaced whatever the server said.
  }
  clearStorageUserSettings();
  clearAtomStorage(userAtom);
  clearAtomStorage(hideModalTemporarilyAtom);
  clearAtomStorage(systemConfigAtom);
  // Not `clearAtomStorage` — that writes `null`, and the atom is typed
  // `string` because `decryptPassword` is handed it directly.
  setAtomStorage(initialPasswordAtom, '');

  if (res?.logout_url) {
    window.location.href = res.logout_url;
  }
  return;
};

export const accessToken = async () => {
  return request(`${AUTH_API}/token`, {
    method: 'POST'
  });
};

export const updatePassword = async (params: any) => {
  return request(`${AUTH_API}/update-password`, {
    method: 'POST',
    data: params
  });
};

export type ExternalAuth = {
  // Provider kind (``OIDC`` / ``SAML`` / ``CAS`` / …). Stays a free-form
  // string so adding a new provider on the backend doesn't require a
  // TypeScript change here.
  type: string;
  // Browser-facing login URL the SSO button should navigate to.
  login_url: string;
};

export const fetchAuthConfig = async () => {
  return request<{
    external_auth: ExternalAuth | null;
    first_time_setup: boolean;
    get_initial_password_command: string;
  }>(AUTH_CONFIG_API);
};
