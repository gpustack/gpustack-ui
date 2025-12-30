import { routeCacheAtom, setRouteCache } from '@/atoms/route-cache';
import { GPUStackVersionAtom, userAtom } from '@/atoms/user';
import DarkMask from '@/components/dark-mask';
import IconFont from '@/components/icon-font';
import routeCachekey from '@/config/route-cachekey';
import { DEFAULT_ENTER_PAGE } from '@/config/settings';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useUserSettings from '@/hooks/use-user-settings';
import useAddResource from '@/pages/dashboard/hooks/use-add-resource';
import { logout } from '@/pages/login/apis';
import { useAccessMarkedRoutes } from '@@/plugin-access';
import { useModel } from '@@/plugin-model';
import { ProLayout } from '@ant-design/pro-components';
import {
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
import { useEffect, useMemo, useRef } from 'react';
import { PageContainerInner } from '../pages/_components/page-box';
import Exception from './Exception';
import './Layout.css';
import { LogoIcon, SLogoIcon } from './Logo';
import ErrorBoundary from './error-boundary';
import { ExtraContent } from './extraRender';
import { patchRoutes } from './runtime';
import SiderMenu from './sider-menu';

const NO_CONTAINER_PAGES = [
  'chat',
  'rerank',
  'embedding',
  'speech',
  'image',
  'text2images',
  'clusterDetail',
  'clusterCreate'
];

const CHECK_RESOURCE_PATH = [
  '/resources/workers',
  '/cluster-management/clusters/list',
  '/cluster-management/credentials',
  '/cluster-management/clusters/create',
  ''
];

const loginPath = DEFAULT_ENTER_PAGE.login;

// Filter out the routes that need to be displayed, where filterFn indicates the levels that should not be shown
const filterRoutes = (
  routes: IRoute[],
  filterFn: (route: IRoute) => boolean
): any[] => {
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
  const [modal, contextHolder] = Modal.useModal();
  const { themeData, setUserSettings, userSettings } = useUserSettings();
  const [userInfo] = useAtom(userAtom);
  const [routeCache] = useAtom(routeCacheAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();
  const { clientRoutes } = useAppData();
  const [version] = useAtom(GPUStackVersionAtom);
  const requestResourceRef = useRef<boolean>(false);

  const {
    setLoadingStatus,
    fetchResourceData,
    NoResourceModal,
    loadingStatus
  } = useAddResource({
    onCreate() {
      requestResourceRef.current = false;
    }
  });

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

  const initRouteCacheValue = (pathname) => {
    if (routeCache.get(pathname) === undefined && routeCachekey[pathname]) {
      setRouteCache(pathname, false);
    }
  };

  const dropRouteCache = (pathname: string) => {
    for (let key of routeCache.keys()) {
      if (key !== pathname && !routeCache.get(key) && routeCachekey[key]) {
        dropByCacheKey(key);
        routeCache.delete(key);
      }
    }
  };

  const runtimeConfig = {
    ...initialInfo,
    logout: async () => {
      await logout();
      navigate(loginPath);
    },
    showVersion: () => {},
    showShortcuts: () => {},
    notFound: <span>404 not found</span>
  };

  const handleToggleCollapse = (e: any) => {
    e.stopPropagation();
    setUserSettings({
      ...userSettings,
      collapsed: !userSettings.collapsed
    });
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

  const isNoContainerPage = useMemo(() => {
    return NO_CONTAINER_PAGES.includes(matchedRoute?.name);
  }, [matchedRoute]);

  console.log('matchedRoute=========', matchedRoute, route);

  useEffect(() => {
    const body = document.querySelector('body');
    if (body) {
      const ins = initialize(body);
      window.__GPUSTACK_BODY_SCROLLER__ = ins;
    }
  }, [initialize]);

  const collapsed = useMemo(() => {
    return userSettings.collapsed || false;
  }, [userSettings.collapsed]);

  const renderMenuHeader = (logo: React.ReactNode, title: React.ReactNode) => {
    return (
      <>
        {logo}
        <div className="collapse-wrap" onClick={handleToggleCollapse}>
          <Button
            style={{
              marginRight: collapsed ? 0 : -14,
              border: 'none',
              cursor: 'w-resize'
            }}
            size="small"
            type={collapsed ? 'default' : 'text'}
          >
            <IconFont
              type={collapsed ? 'icon-expand-left' : 'icon-expand-right'}
              className="font-size-18 text-secondary"
              style={{
                display: 'block'
              }}
            />
          </Button>
        </div>
      </>
    );
  };

  const menuContentRender = (menuProps: any, defaultDom: React.ReactNode) => {
    return <SiderMenu {...menuProps}></SiderMenu>;
  };

  const onPageChange = async (route: any) => {
    const { location } = history;
    const { pathname } = location;

    if (
      !CHECK_RESOURCE_PATH.includes(pathname) &&
      initialState?.currentUser?.is_admin &&
      !requestResourceRef.current &&
      !userSettings.hideAddResourceModal
    ) {
      requestResourceRef.current = true;
      await fetchResourceData();
    }

    initRouteCacheValue(pathname);
    dropRouteCache(pathname);

    // if user is not change password, redirect to change password page
    if (location.pathname !== loginPath && userInfo?.require_password_change) {
      history.push(loginPath);
      return;
    }

    // if user is not logged in, redirect to login page
    if (!initialState?.currentUser && location.pathname !== loginPath) {
      history.push(loginPath);
    } else if (location.pathname === '/') {
      const pathname = initialState?.currentUser?.is_admin
        ? DEFAULT_ENTER_PAGE.adminForNormal
        : DEFAULT_ENTER_PAGE.user;
      history.push(pathname);
    }
  };

  const onMenuHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const pagepath = initialState?.currentUser?.is_admin
      ? DEFAULT_ENTER_PAGE.adminForNormal
      : DEFAULT_ENTER_PAGE.user;

    navigate(pagepath);
  };

  const onCollapse = (value: boolean) => {
    // only trigger by window resize
    if (!value) {
      return;
    }
    setUserSettings({
      ...userSettings,
      collapsed: value
    });
  };

  return (
    <ConfigProvider
      componentSize="large"
      key={userSettings.colorPrimary}
      theme={{
        algorithm: userSettings.isDarkTheme
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,
        ...themeData
      }}
    >
      <DarkMask></DarkMask>
      <ProLayout
        fixSiderbar
        fixedHeader
        breadcrumbRender={false}
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
        extra={[
          <ExtraContent
            key="extra-content"
            isDarkTheme={userSettings.isDarkTheme}
          />
        ]}
        collapsed={userSettings.collapsed}
        onPageChange={onPageChange}
        formatMessage={formatMessage}
        menu={{
          locale: true,
          type: 'group'
        }}
        splitMenus={true}
        logo={userSettings.collapsed ? <SLogoIcon /> : <LogoIcon />}
        menuContentRender={menuContentRender}
        disableContentMargin
        {...runtimeConfig}
        ErrorBoundary={ErrorBoundary}
      >
        <Exception
          route={matchedRoute}
          noFound={runtimeConfig?.noFound}
          notFound={runtimeConfig?.notFound}
          unAccessible={runtimeConfig?.unAccessible}
          noAccessible={runtimeConfig?.noAccessible}
        >
          {isNoContainerPage ? (
            <Outlet />
          ) : (
            <PageContainerInner>
              <Outlet />
            </PageContainerInner>
          )}
        </Exception>
        {NoResourceModal}
      </ProLayout>
      {contextHolder}
    </ConfigProvider>
  );
};
