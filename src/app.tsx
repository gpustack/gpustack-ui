import { userSettingsHelperAtom } from '@/atoms/settings';
import { GPUStackVersionAtom, UpdateCheckAtom, userAtom } from '@/atoms/user';
import { setAtomStorage } from '@/atoms/utils';
import { DEFAULT_ENTER_PAGE, GPUSTACK_API_BASE_URL } from '@/config/settings';
import { COLOR_PRIMARY } from '@/config/theme/constants';
import { getGPUStackPlugin } from '@/plugins';
import { enterprisePluginReady } from '@/plugins/enterprise-ready';
import { GPUStackPluginManager } from '@/plugins/manager';
import { requestConfig } from '@/request-config';
import {
  queryCurrentUserState,
  queryVersionInfo,
  updateCheck
} from '@/services/profile/apis';
import { fetchSystemConfig } from '@/services/system/query-system-config';
import { isOnline } from '@/utils';
import {
  markInitialStateProbed,
  probeAccessFlags
} from '@/utils/access-probes';
import { installTenantFetch } from '@/utils/install-fetch';
import {
  IS_FIRST_LOGIN,
  readState,
  writeState
} from '@/utils/localstore/index';
import '@gpustack/core-ui/style.css';
import { RequestConfig, history, request as umiRequest } from '@umijs/max';
import { message } from 'antd';

installTenantFetch();

// only for the first login and access from http://localhost

const checkDefaultPage = async (userInfo: any) => {
  const isFirstLogin = await readState(IS_FIRST_LOGIN);
  if (isFirstLogin === null && isOnline()) {
    writeState(IS_FIRST_LOGIN, true);
    if (userInfo && userInfo?.is_admin) {
      history.push(DEFAULT_ENTER_PAGE.adminForFirst);
    }
  }
};

// runtime configuration
export async function getInitialState(): Promise<{
  fetchUserInfo: () => Promise<Global.UserInfo>;
  currentUser?: Global.UserInfo;
  pluginData?: Record<string, any>;
  hasKubernetesCluster?: boolean;
  hasResourceEvents?: boolean;
}> {
  const { location } = history;

  // In open-source builds the promise resolves immediately.
  await enterprisePluginReady;

  // initialize plugins and merge enterprise locales
  let pluginData = {};
  try {
    pluginData = await GPUStackPluginManager.initialize({
      request: umiRequest,
      setUserSettings: (value) => setAtomStorage(userSettingsHelperAtom, value),
      setStorageUserSettings: (value) =>
        setAtomStorage(userSettingsHelperAtom, value),
      defaultColorPrimary: COLOR_PRIMARY
    });
  } catch (error) {
    console.error('Failed to initialize plugins:', error);
  }

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

  const fetchUserInfo = async (config?: {
    skipErrorHandler?: boolean;
  }): Promise<Global.UserInfo> => {
    try {
      const data = await queryCurrentUserState({
        skipErrorHandler: true
      });
      if (data.is_admin) {
        getUpdateCheck();
        fetchSystemConfig();
      }
      // Only commit a substantive user object. A truthy-but-empty
      // `data` (e.g. server responded 200 with an empty body) would
      // otherwise look like "logged in" to every `currentUser`
      // reader and the access seam — break out instead and let the
      // caller treat the request as failed.
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        // Commit the identity to atom storage (and so to localStorage)
        // before returning. The access function — memoized on
        // `initialState` and run once per commit — reads identity from
        // localStorage; without this preemptive write the predicate
        // sees the prior session's identity on its first evaluation
        // after login, and stays stale until the next identity change
        // (which usually doesn't come without a manual refresh).
        try {
          setAtomStorage(userAtom, data);
        } catch (err) {
          console.error('userAtom commit error:', err);
        }
        // Fire `onUserFetched` so plugins maintaining identity-scoped
        // caches can seed them under the new identity before any
        // caller commits this user to `initialState`. Errors here are
        // swallowed and logged — fetchUserInfo must still return.
        try {
          await getGPUStackPlugin()?.login?.onUserFetched?.(data, {
            request: umiRequest
          });
        } catch (err) {
          console.error('onUserFetched plugin hook error:', err);
        }
      }
      return data;
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.code === 401 && data?.message.includes('deactivate')) {
        message.error({
          content: (
            <div>
              <span>{data?.message}</span>
            </div>
          ),
          duration: 5
        });
      }
      history.push(DEFAULT_ENTER_PAGE.login);
    }
    return {} as Global.UserInfo;
  };

  const getAppVersionInfo = async () => {
    try {
      const data = await queryVersionInfo();

      const isDev = data.version?.indexOf('0.0.0') > -1;
      const isRc = data.version?.indexOf('rc') > -1;

      setAtomStorage(GPUStackVersionAtom, {
        ...data,
        isProd: !isDev && !isRc,
        isDev,
        isRc
      });
    } catch (error) {
      console.error('queryVersionInfo error', error);
    }
  };

  getAppVersionInfo();

  if (![DEFAULT_ENTER_PAGE.login].includes(location.pathname)) {
    const [userInfo, accessFlags] = await Promise.all([
      fetchUserInfo(),
      probeAccessFlags()
    ]);
    // Record that the probes ran for an authenticated user this page load
    // (the refresh path) so the layout doesn't re-probe. A failed
    // fetch (empty user — e.g. unauthenticated deep link that bounces to
    // login) is NOT marked: the user will log in via SPA afterwards and
    // the layout becomes responsible for probing.
    if (userInfo?.username) {
      markInitialStateProbed();
    }
    checkDefaultPage(userInfo);
    return {
      fetchUserInfo,
      currentUser: userInfo,
      pluginData,
      ...accessFlags
    };
  }
  return {
    fetchUserInfo,
    pluginData
  };
}

export const request: RequestConfig = {
  baseURL: `/${GPUSTACK_API_BASE_URL}`,
  ...requestConfig
};
