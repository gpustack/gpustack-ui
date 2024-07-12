import { GPUStackVersionAtom } from '@/atoms/user';
import { setAtomStorage } from '@/atoms/utils';
import { RequestConfig, history } from '@umijs/max';
import { requestConfig } from './request-config';
import {
  queryCurrentUserState,
  queryVersionInfo
} from './services/profile/apis';

const loginPath = '/login';
let currentUserInfo: any = {};

// 运行时配置

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{
  fetchUserInfo: () => Promise<Global.UserInfo>;
  currentUser?: Global.UserInfo;
}> {
  // 如果不是登录页面，执行
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
      console.log('versioninfo=========', data);
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
