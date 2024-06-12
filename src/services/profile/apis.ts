import { request } from '@umijs/max';

export async function queryCurrentUserState(opts?: Record<string, any>) {
  return request(`/users/me`, {
    method: 'GET',
    ...opts
  });
}
