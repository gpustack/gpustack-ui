// @ts-nocheck

import { routeCacheAtom, setRouteCache } from '@/atoms/route-cache';
import { GPUStackVersionAtom, UpdateCheckAtom, userAtom } from '@/atoms/user';
import ShortCuts, {
  modalConfig as ShortCutsConfig
} from '@/components/short-cuts';
import VersionInfo, { modalConfig } from '@/components/version-info';
import routeCachekey from '@/config/route-cachekey';
import useBodyScroll from '@/hooks/use-body-scroll';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useUserSettings from '@/hooks/use-user-settings';
import { logout } from '@/pages/login/apis';
import { useAccessMarkedRoutes } from '@@/plugin-access';
import { useModel } from '@@/plugin-model';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import {
  Link,
  Outlet,
  dropByCacheKey,
  history,
  matchRoutes,
  useAppData,
  useIntl,
  useLocation,
  useNavigate,
  type IRoute
} from '@umijs/max';
import { Button, ConfigProvider, Modal, theme } from 'antd';
import 'driver.js/dist/driver.css';
import { useAtom } from 'jotai';
import 'overlayscrollbars/overlayscrollbars.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Exception from './Exception';
import './Layout.css';
import { LogoIcon, SLogoIcon } from './Logo';
import { getRightRenderContent } from './rightRender';
import { patchRoutes } from './runtime';

const loginPath = '/login';

type InitialStateType = {
  fetchUserInfo: () => Promise<Global.UserInfo>;
  currentUser?: Global.UserInfo;
};

// Filter out the routes that need to be displayed, where filterFn indicates the levels that should not be shown
const filterRoutes = (
  routes: IRoute[],
  filterFn: (route: IRoute) => boolean
) => {
  if (routes.length === 0) {
    return [];
  }

  let newRoutes = [];
  for (const route of routes) {
    const newRoute = { ...route };
    if (filterFn(route)) {
      if (Array.isArray(newRoute.routes)) {
        newRoutes.push(...filterRoutes(newRoute.routes, filterFn));
      }
    } else {
      if (Array.isArray(newRoute.children)) {
        newRoute.children = filterRoutes(newRoute.children, filterFn);
        newRoute.routes = newRoute.children;
      }
      newRoutes.push(newRoute);
    }
  }

  return newRoutes;
};

const mapRoutes = (routes: IRoute[], role: string) => {
  if (routes.length === 0) {
    return [];
  }
  return routes.map((route) => {
    const newRoute = { ...route, role };
    if (route.originPath) {
      newRoute.path = route.originPath;
    }

    if (Array.isArray(route.routes)) {
      newRoute.routes = mapRoutes(route.routes, role);
    }

    if (Array.isArray(route.children)) {
      newRoute.children = mapRoutes(route.children, role);
    }

    return newRoute;
  });
};

export default (props: any) => {
  const { initialize: initialize } = useOverlayScroller({
    defer: false
  });
  const { themeData, setTheme, userSettings, isDarkTheme } = useUserSettings();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const { initialize: initializeMenu } = useOverlayScroller();
  const [userInfo] = useAtom(userAtom);
  const [routeCache] = useAtom(routeCacheAtom);
  const [version] = useAtom(GPUStackVersionAtom);
  const [updateCheck] = useAtom(UpdateCheckAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();
  const { clientRoutes, pluginManager } = useAppData();
  const [collapsed, setCollapsed] = useState(false);
  const [collapseValue, setCollapseValue] = useState(false);

  const initialInfo = (useModel && useModel('@@initialState')) || {
    initialState: undefined,
    loading: false,
    setInitialState: null
  };

  const { initialState, loading, setInitialState } = initialInfo;

  const userConfig = {
    title: '',
    locale: true
  };

  const formatMessage = (args) => {
    return intl.formatMessage({ id: args.id });
  };

  const showVersion = () => {
    saveScrollHeight();
    Modal.info({
      ...modalConfig,
      width: 460,
      content: <VersionInfo intl={intl} />,
      onCancel: restoreScrollHeight
    });
  };

  const showShortcuts = () => {
    Modal.info({
      ...ShortCutsConfig,
      content: <ShortCuts intl={intl} />
    });
  };

  const initRouteCacheValue = (pathname) => {
    if (routeCache.get(pathname) === undefined && routeCachekey[pathname]) {
      setRouteCache(pathname, false);
    }
  };

  const dropRouteCache = (pathname) => {
    for (let key of routeCache.keys()) {
      if (key !== pathname && !routeCache.get(key) && routeCachekey[key]) {
        dropByCacheKey(key);
        routeCache.delete(key);
      }
    }
  };

  const runtimeConfig = {
    ...initialInfo,
    logout: async (userInfo) => {
      await logout();
      navigate(loginPath);
    },
    showVersion: () => {
      return showVersion();
    },
    showShortcuts: () => {
      return showShortcuts();
    },
    setTheme: setTheme,
    toggleTheme: () => {
      const newTheme = userSettings.theme === 'realDark' ? 'light' : 'realDark';
      setTheme(newTheme);
    },
    notFound: <span>404 not found</span>
  };

  const handleToggleCollapse = (e: any) => {
    e.stopPropagation();
    setCollapsed(!collapsed);
  };

  const newRoutes = filterRoutes(
    clientRoutes.filter((route) => route.id === 'max-tabs'),
    (route) => {
      return (
        (!!route.isLayout && route.id !== '@@/global-layout') ||
        !!route.isWrapper
      );
    }
  );

  const role = initialState?.currentUser?.is_admin ? 'admin' : 'user';
  const [route] = useAccessMarkedRoutes(mapRoutes(newRoutes, role));

  patchRoutes({
    routes: route.children,
    initialState: initialInfo.initialState
  });

  const matchedRoute = useMemo(
    () => matchRoutes(route?.children || [], location.pathname)?.pop?.()?.route,
    [location.pathname]
  );

  const showUpgrade = useMemo(() => {
    return (
      initialState?.currentUser?.is_admin &&
      updateCheck.latest_version &&
      updateCheck.latest_version !== version?.version &&
      updateCheck.latest_version?.indexOf('0.0.0') === -1 &&
      updateCheck.latest_version?.indexOf('rc') === -1
    );
  }, [
    updateCheck.latest_version,
    version.version,
    initialState?.currentUser?.is_admin
  ]);

  useEffect(() => {
    const body = document.querySelector('body');
    if (body) {
      const ins = initialize(body);
      window.__GPUSTACK_BODY_SCROLLER__ = ins;
    }
  }, [initialize]);

  useEffect(() => {
    const checkAndInitialize = () => {
      const menuWrap = window.document.querySelector(
        '.ant-menu.ant-menu-root'
      )?.parentElement;
      if (menuWrap) {
        try {
          initializeMenu(menuWrap);
        } catch (error) {
          console.error('Failed to initialize menu:', error);
        }
      } else {
        console.warn('Menu wrapper not found.');
      }
    };

    const timeout = setTimeout(checkAndInitialize, 500);

    return () => clearTimeout(timeout);
  }, [initializeMenu, matchedRoute, location]);

  const renderMenuHeader = useCallback(
    (logo, title) => {
      return (
        <>
          {logo}
          <div className="collapse-wrap" onClick={handleToggleCollapse}>
            <Button
              style={{ marginRight: collapsed ? 0 : -14 }}
              size="small"
              type={collapsed ? 'default' : 'text'}
            >
              <>
                <MenuUnfoldOutlined
                  style={{ display: collapsed ? 'block' : 'none' }}
                />
                <MenuFoldOutlined
                  style={{ display: !collapsed ? 'block' : 'none' }}
                />
              </>
            </Button>
          </div>
        </>
      );
    },
    [collapsed]
  );

  const actionRender = useCallback(
    (layoutProps) => {
      const dom = getRightRenderContent({
        runtimeConfig,
        loading,
        initialState,
        setInitialState,
        intl,
        isDarkTheme: userSettings.isDarkTheme,
        siderWidth: layoutProps.siderWidth,
        collapsed: layoutProps.collapsed,
        showUpgrade
      });

      return dom;
    },
    [intl, showUpgrade, userSettings.theme, userSettings.isDarkTheme]
  );

  const itemRender = useCallback((route, _, routes) => {
    const { breadcrumbName, title, path } = route;
    const label = title || breadcrumbName;
    const last = routes[routes.length - 1];
    if (last) {
      if (last.path === path || last.linkPath === path) {
        return <span>{label}</span>;
      }
    }
    return <Link to={path}>{label}</Link>;
  }, []);

  const menuItemRender = useCallback(
    (menuItemProps, defaultDom) => {
      if (menuItemProps.isUrl || menuItemProps.children) {
        return defaultDom;
      }
      if (menuItemProps.path && location.pathname !== menuItemProps.path) {
        return (
          <Link
            to={menuItemProps.path.replace('/*', '')}
            target={menuItemProps.target}
          >
            {defaultDom}
          </Link>
        );
      }
      return <>{defaultDom}</>;
    },
    [location.pathname]
  );

  const onPageChange = useCallback(
    (route) => {
      const { location } = history;
      const { pathname } = location;

      initRouteCacheValue(pathname);
      dropRouteCache(pathname);

      // if user is not change password, redirect to change password page
      if (
        location.pathname !== loginPath &&
        userInfo?.require_password_change
      ) {
        history.push(loginPath);
        return;
      }

      // if user is not logged in, redirect to login page
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      } else if (location.pathname === '/') {
        const pathname = initialState?.currentUser?.is_admin
          ? '/dashboard'
          : '/playground';
        history.push(pathname);
      }
    },
    [userInfo?.require_password_change, initialState?.currentUser]
  );

  const onMenuHeaderClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    navigate('/dashboard');
  }, []);

  const onCollapse = (value) => {
    setCollapsed(value);
  };

  useEffect(() => {
    // clear previous marks and measures
    performance.clearMarks();
    performance.clearMeasures();

    // record start time
    performance.mark('route-start');

    requestAnimationFrame(() => {
      // record end time
      performance.mark('route-end');

      // make sure `route-start` exists
      if (performance.getEntriesByName('route-start').length > 0) {
        performance.measure('route-change', 'route-start', 'route-end');

        const measure = performance.getEntriesByName('route-change')[0];
        console.log(
          `[Performance] Route change to ${location.pathname} took ${measure.duration.toFixed(2)}ms`
        );

        // clear marks and measures
        performance.clearMarks();
        performance.clearMeasures();
      } else {
        console.warn('Missing performance mark: route-start');
      }
    });
  }, [location.pathname]);

  const onRenderCallback = (id, phase, actualDuration) => {
    console.log(
      `[Profiler] Route: ${id} - Phase: ${phase} - Render time: ${actualDuration.toFixed(2)}ms`
    );
  };

  return (
    <ConfigProvider
      componentSize="large"
      theme={{
        algorithm: userSettings.isDarkTheme
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,
        ...themeData
      }}
    >
      <ProLayout
        route={route}
        location={location}
        title={userConfig.title}
        navTheme={userSettings.theme}
        layout="side"
        contentStyle={{
          paddingBlock: 0,
          paddingInline: 0
        }}
        openKeys={false}
        disableMobile={true}
        header={{
          title: <div style={{ fontSize: 36 }}> gpuStack </div>
        }}
        siderWidth={220}
        onCollapse={onCollapse}
        onMenuHeaderClick={onMenuHeaderClick}
        menuHeaderRender={renderMenuHeader}
        collapsed={collapsed}
        onPageChange={onPageChange}
        formatMessage={formatMessage}
        menu={{
          locale: true
        }}
        logo={collapsed ? SLogoIcon : LogoIcon}
        menuItemRender={menuItemRender}
        itemRender={itemRender}
        disableContentMargin
        fixSiderbar
        fixedHeader
        {...runtimeConfig}
        actionsRender={actionRender}
      >
        <Exception
          route={matchedRoute}
          noFound={runtimeConfig?.noFound}
          notFound={runtimeConfig?.notFound}
          unAccessible={runtimeConfig?.unAccessible}
          noAccessible={runtimeConfig?.noAccessible}
        >
          {runtimeConfig.childrenRender ? (
            runtimeConfig.childrenRender(<Outlet />, props)
          ) : (
            <Outlet />
          )}
        </Exception>
      </ProLayout>
    </ConfigProvider>
  );
};
