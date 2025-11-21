import { userAtom } from '@/atoms/user';
import { clearAtomStorage, clearStorageUserSettings } from '@/atoms/utils';
import { request } from '@umijs/max';
import qs from 'query-string';

export const AUTH_API = '/auth';

export const AUTH_CONFIG_API = '/auth-config';

export const AUTH_OIDC_LOGIN_API = '/auth/oidc/login';
export const AUTH_SAML_LOGIN_API = '/auth/saml/login';

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
  await request(`${AUTH_API}/logout`, {
    method: 'POST'
  });
  clearStorageUserSettings();
  clearAtomStorage(userAtom);
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

export const fetchAuthConfig = async () => {
  return request(AUTH_CONFIG_API);
};
