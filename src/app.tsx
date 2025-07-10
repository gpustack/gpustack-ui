import { GPUStackVersionAtom, UpdateCheckAtom } from '@/atoms/user';
import { setAtomStorage } from '@/atoms/utils';
import { requestConfig } from '@/request-config';
import {
  queryCurrentUserState,
  queryVersionInfo,
  updateCheck
} from '@/services/profile/apis';
import { isOnline } from '@/utils';
import {
  IS_FIRST_LOGIN,
  readState,
  writeState
} from '@/utils/localstore/index';
import { RequestConfig, history } from '@umijs/max';

const loginPath = '/login';

// only for the first login and access from http://localhost

const checkDefaultPage = async (userInfo: any) => {
  const isFirstLogin = await readState(IS_FIRST_LOGIN);
  if (isFirstLogin === null && isOnline()) {
    writeState(IS_FIRST_LOGIN, true);
    if (userInfo && userInfo?.is_admin) {
      history.push('/models/deployments');
    }
  }
};

// runtime configuration
export async function getInitialState(): Promise<{
  fetchUserInfo: () => Promise<Global.UserInfo>;
  currentUser?: Global.UserInfo;
}> {
  const { location } = history;

  const getUpdateCheck = async () => {
    try {
      const data = await updateCheck();

      setAtomStorage(UpdateCheckAtom, {
        ...data
      });
      return data;
    } catch (error) {
      console.error('updateCheck error', error);
    }
  };

  const fetchUserInfo = async (): Promise<Global.UserInfo> => {
    try {
      const data = await queryCurrentUserState({
        skipErrorHandler: true
      });
      if (data.is_admin) {
        getUpdateCheck();
      }
      return data;
    } catch (error) {
      history.push(loginPath);
    }
    return {} as Global.UserInfo;
  };

  const getAppVersionInfo = async () => {
    try {
      const data = await queryVersionInfo();
      const isProduction = data.version?.indexOf('0.0.0') === -1;
      setAtomStorage(GPUStackVersionAtom, {
        ...data,
        isProduction
      });
    } catch (error) {
      console.error('queryVersionInfo error', error);
    }
  };

  getAppVersionInfo();

  if (![loginPath].includes(location.pathname)) {
    const userInfo = await fetchUserInfo();
    checkDefaultPage(userInfo);
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
