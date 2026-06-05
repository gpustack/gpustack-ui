import { userSettingsHelperAtom } from '@/atoms/settings';
import { GPUStackVersionAtom, UpdateCheckAtom, userAtom } from '@/atoms/user';
import { setAtomStorage } from '@/atoms/utils';
import { DEFAULT_ENTER_PAGE, GPUSTACK_API_BASE_URL } from '@/config/settings';
import { COLOR_PRIMARY } from '@/config/theme/constants';
import { queryClusterList } from '@/pages/cluster-management/apis';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import { queryResourceEvents } from '@/pages/usage/apis/resource';
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

// Probes the caller's cluster list once so access predicates can gate
// GPU Service (Kubernetes-only). Cheap (one list request) and never
// blocks login — any failure just falls back to `undefined`, which
// the predicate treats as "unknown / don't restrict beyond role".
// The result is also mirrored into sessionStorage so access extensions
// that run without the initialState argument can read it (e.g. to
// override the admin shortcut in scopes where the menu shouldn't
// show even for admins).
const HAS_K8S_CLUSTER_KEY = 'hasKubernetesCluster';
const probeHasKubernetesCluster = async (): Promise<boolean | undefined> => {
  try {
    const res = await queryClusterList({ page: -1 });
    const value = (res?.items ?? []).some(
      (c) => c?.provider === ProviderValueMap.Kubernetes
    );
    try {
      window.sessionStorage.setItem(HAS_K8S_CLUSTER_KEY, JSON.stringify(value));
    } catch {
      // sessionStorage may be unavailable (Safari private mode); the
      // access predicate already handles a missing value as "unknown".
    }
    return value;
  } catch (error) {
    console.error('probeHasKubernetesCluster error', error);
    try {
      window.sessionStorage.removeItem(HAS_K8S_CLUSTER_KEY);
    } catch {
      // ignore
    }
    return undefined;
  }
};

// Probes whether the caller has ANY resource-usage events (GPU/CPU instance or
// storage lifecycle). Used alongside the cluster probe so a user who has run
// GPU instances still sees GPU Service / the full Usage page even if they
// currently have no Kubernetes cluster. Mirrored into sessionStorage for the
// access extensions; any failure → undefined ("unknown — don't restrict").
const HAS_RESOURCE_EVENTS_KEY = 'hasResourceEvents';
const probeHasResourceEvents = async (): Promise<boolean | undefined> => {
  try {
    // No date range = "ever"; scope is clamped to the caller server-side.
    const res = await queryResourceEvents(
      { perPage: 1 },
      {
        skipErrorHandler: true
      }
    );
    const value = (res?.pagination?.total ?? 0) > 0;
    try {
      window.sessionStorage.setItem(
        HAS_RESOURCE_EVENTS_KEY,
        JSON.stringify(value)
      );
    } catch {
      // sessionStorage may be unavailable; predicate treats missing as unknown.
    }
    return value;
  } catch (error) {
    console.error('probeHasResourceEvents error', error);
    try {
      window.sessionStorage.removeItem(HAS_RESOURCE_EVENTS_KEY);
    } catch {
      // ignore
    }
    return undefined;
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
    const [userInfo, hasKubernetesCluster, hasResourceEvents] =
      await Promise.all([
        fetchUserInfo(),
        probeHasKubernetesCluster(),
        probeHasResourceEvents()
      ]);
    checkDefaultPage(userInfo);
    return {
      fetchUserInfo,
      currentUser: userInfo,
      pluginData,
      hasKubernetesCluster,
      hasResourceEvents
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
