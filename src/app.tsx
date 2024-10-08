import { GPUStackVersionAtom } from '@/atoms/user';
import { setAtomStorage } from '@/atoms/utils';
import { requestConfig } from '@/request-config';
import {
  queryCurrentUserState,
  queryVersionInfo
} from '@/services/profile/apis';
import { RequestConfig, history } from '@umijs/max';

const loginPath = '/login';

// runtime configuration
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

    return {
      fetchUserInfo,
      currentUser: userInfo
    };
  }
  return {
    fetchUserInfo
  };
}

export const request: RequestConfig = {
  baseURL: ' /v1',
  ...requestConfig
};
