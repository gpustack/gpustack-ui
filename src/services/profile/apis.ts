import { request } from '@umijs/max';

export async function queryCurrentUserState(opts?: Record<string, any>) {
  return request<Global.UserInfo>(`/users/me`, {
    method: 'GET',
    ...opts
  });
}

export async function queryVersionInfo() {
  return request(`/version`, {
    method: 'GET'
  });
}

export async function updateCheck() {
  return request(`/update/`, {
    method: 'GET'
  });
}
