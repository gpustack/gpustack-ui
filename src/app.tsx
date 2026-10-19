import { userSettingsHelperAtom } from '@/atoms/settings';
import { GPUStackVersionAtom, UpdateCheckAtom, userAtom } from '@/atoms/user';
import { setAtomStorage } from '@/atoms/utils';
import PublicPageProvider from '@/components/public-page-provider';
import { DEFAULT_ENTER_PAGE, GPUSTACK_API_BASE_URL } from '@/config/settings';
import { COLOR_PRIMARY } from '@/config/theme/constants';
import ErrorBoundary from '@/layouts/error-boundary';
import { ensureCurrentLocaleMessages } from '@/locales/load-messages';
import { canInitializeConsole, getGPUStackPlugin } from '@/plugins';
import { enterprisePluginReady } from '@/plugins/enterprise-ready';
import { GPUStackPluginManager } from '@/plugins/manager';
import { isPluginPublicPage } from '@/plugins/public-routes';
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

let routerBasename = '/';

const isCurrentPublicPage = () =>
  isPluginPublicPage(
    history.location.pathname,
    GPUStackPluginManager.getAll().values(),
    routerBasename
  );

// Umi history.location retains the base, while Router useLocation strips it.
// Capture the renderer's runtime value before initial-state hooks mount.
export function modifyClientRenderOpts<T extends { basename?: string }>(
  options: T
): T {
  routerBasename = options.basename || '/';
  return options;
}

// only for the first login and access from http://localhost

const checkDefaultPage = async (userInfo: any) => {
  const isFirstLogin = await readState(IS_FIRST_LOGIN);
  if (isFirstLogin === null && isOnline()) {
    writeState(IS_FIRST_LOGIN, true);
    if (userInfo && userInfo?.is_admin && !isCurrentPublicPage()) {
      history.push(DEFAULT_ENTER_PAGE.adminForFirst);
    }
  }
};

// runtime configuration
export async function getInitialState(): Promise<{
  fetchUserInfo: () => Promise<Global.UserInfo>;
  currentUser?: Global.UserInfo;
  pluginData?: Record<string, any>;
  isPublicPage?: boolean;
  hasKubernetesCluster?: boolean;
  hasResourceEvents?: boolean;
}> {
  // In open-source builds the promise resolves immediately.
  await enterprisePluginReady;

  // Public boot must not consume the plugins' one-time management initialization.
  let pluginData = {};
  if (!isCurrentPublicPage()) {
    try {
      pluginData = await GPUStackPluginManager.initialize({
        request: umiRequest,
        isPublicPage: false,
        setUserSettings: (value) =>
          setAtomStorage(userSettingsHelperAtom, value),
        setStorageUserSettings: (value) =>
          setAtomStorage(userSettingsHelperAtom, value),
        defaultColorPrimary: COLOR_PRIMARY
      });
    } catch (error) {
      console.error('Failed to initialize plugins:', error);
    }
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

  let businessInitializationAllowed = false;
  const fetchUserInfo = async (config?: {
    skipErrorHandler?: boolean;
  }): Promise<Global.UserInfo> => {
    businessInitializationAllowed = false;
    try {
      const data = await queryCurrentUserState({
        skipErrorHandler: true
      });
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
        businessInitializationAllowed = await canInitializeConsole(umiRequest);
        if (data.is_admin && businessInitializationAllowed) {
          getUpdateCheck();
          fetchSystemConfig();
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
      if (!isCurrentPublicPage()) history.push(DEFAULT_ENTER_PAGE.login);
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

  // Public plugin pages have their own credential and data flow. Do not probe
  // management identity, access flags or version/update state on their behalf.
  if (isCurrentPublicPage()) {
    return { fetchUserInfo, pluginData, isPublicPage: true };
  }

  getAppVersionInfo();

  if (![DEFAULT_ENTER_PAGE.login].includes(history.location.pathname)) {
    const userInfo = await fetchUserInfo();
    if (isCurrentPublicPage()) {
      return { fetchUserInfo, pluginData, isPublicPage: true };
    }
    const accessFlags =
      userInfo?.username && businessInitializationAllowed
        ? await probeAccessFlags()
        : {};
    if (isCurrentPublicPage()) {
      return { fetchUserInfo, pluginData, isPublicPage: true };
    }
    // Record that the probes ran for an authenticated user this page load
    // (the refresh path) so the layout doesn't re-probe. A failed
    // fetch (empty user — e.g. unauthenticated deep link that bounces to
    // login) is NOT marked: the user will log in via SPA afterwards and
    // the layout becomes responsible for probing.
    if (userInfo?.username && businessInitializationAllowed) {
      markInitialStateProbed();
      checkDefaultPage(userInfo);
    }
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
  ...requestConfig,
  errorConfig: {
    ...requestConfig.errorConfig,
    errorHandler: (error, options) => {
      // A deferred management request may fail after navigation back to public.
      if (!isCurrentPublicPage()) {
        requestConfig.errorConfig?.errorHandler?.(error, options);
      }
    }
  }
};

export function render(oldRender: () => void) {
  // ja-JP / ru-RU / tr-TR messages live in async chunks (src/locales/load-messages.ts),
  // so the active one has to be registered before the tree mounts — otherwise the
  // first paint renders raw message keys and then swaps them out. en-US and zh-CN
  // are still bundled, so those two resolve without touching the network and mount
  // as immediately as they did before. finally(), not then(): ensureCurrentLocaleMessages
  // already falls back to the bundled English copy on a failed fetch, and the app
  // has to start regardless.
  ensureCurrentLocaleMessages().finally(oldRender);
}

export function innerProvider(container: React.ReactNode) {
  return (
    <PublicPageProvider basename={routerBasename}>
      {container}
    </PublicPageProvider>
  );
}

export function rootContainer(container: React.ReactNode) {
  // `ErrorBoundary` is also handed to ProLayout (src/layouts/index.tsx), but that only
  // mounts it around the authenticated content area — the login page renders no ProLayout
  // at all, as `.ant-pro-layout` being absent there confirms. The inner one stays: it keeps
  // the sider and menu on screen when a page inside the layout throws. This outer one is
  // what makes the boundary *universal*, which two things now depend on — it is the only
  // post-mount reload trigger (the pre-mount listener stands down so a hover prefetch can
  // never reload the page), and its mount is the signal that stands that listener down.
  // Both have to hold on every route, signed in or not.
  return <ErrorBoundary>{container}</ErrorBoundary>;
}
