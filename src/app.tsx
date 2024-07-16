import { GPUStackVersionAtom } from '@/atoms/user';
import { setAtomStorage } from '@/atoms/utils';
import { requestConfig } from '@/request-config';
import {
  queryCurrentUserState,
  queryVersionInfo
} from '@/services/profile/apis';
import { RequestConfig, history } from '@umijs/max';

const loginPath = '/login';
let currentUserInfo: any = {};

// 运行时配置
export async function getInitialState(): Promise<{
  fetchUserInfo: () => Promise<Global.UserInfo>;
  currentUser?: Global.UserInfo;
}> {
  const { location } = history;

  const fetchUserInfo = async (): Promise<Global.UserInfo> => {
    try {
      const data = await queryCurrentUserState({
        skipErrorHandler: true
      });
      return data;
    } catch (error) {
      history.push(loginPath);
    }
    return {} as Global.UserInfo;
  };

  const getAppVersionInfo = async () => {
    try {
      const data = await queryVersionInfo();
      setAtomStorage(GPUStackVersionAtom, data);
    } catch (error) {
      console.error('queryVersionInfo error', error);
    }
  };

  getAppVersionInfo();

  if (![loginPath].includes(location.pathname)) {
    const userInfo = await fetchUserInfo();
    currentUserInfo = {
      ...userInfo
    };
    return {
      fetchUserInfo,
      currentUser: userInfo
    };
  }
  return {
    fetchUserInfo
  };
}

console.log('app.tsx');

export const request: RequestConfig = {
  baseURL: ' /v1',
  ...requestConfig
};
