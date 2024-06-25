import { request } from '@umijs/max';
import qs from 'query-string';

export const AUTH_API = '/auth';

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

export const logout = async (userInfo: any) => {
  return request(`${AUTH_API}/logout`, {
    method: 'POST'
  });
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
