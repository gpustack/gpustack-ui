// @ts-nocheck

import { GPUStackVersionAtom, UpdateCheckAtom, userAtom } from '@/atoms/user';
import ShortCuts, {
  modalConfig as ShortCutsConfig
} from '@/components/short-cuts';
import VersionInfo, { modalConfig } from '@/components/version-info';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { logout } from '@/pages/login/apis';
import { useAccessMarkedRoutes } from '@@/plugin-access';
import { useModel } from '@@/plugin-model';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import {
  Link,
  Outlet,
  history,
  matchRoutes,
  useAppData,
  useIntl,
  useLocation,
  useNavigate,
  type IRoute
} from '@umijs/max';
import { Button, Modal } from 'antd';
import { useAtom } from 'jotai';
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
  const { initialize } = useOverlayScroller();
  const { initialize: initializeMenu } = useOverlayScroller();
  const [userInfo] = useAtom(userAtom);
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
    Modal.info({
      ...modalConfig,
      width: 460,
      content: <VersionInfo intl={intl} />
    });
  };

  const showShortcuts = () => {
    Modal.info({
      ...ShortCutsConfig,
      content: <ShortCuts intl={intl} />
    });
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
    notFound: <span>404 not found</span>
  };

  const handleToggleCollapse = (e: any) => {
    e.stopPropagation();
    setCollapsed(!collapsed);
  };

  const newRoutes = filterRoutes(
    clientRoutes.filter((route) => route.id === '@@/global-layout'),
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
      updateCheck.latest_version !== version?.version
    );
  }, [updateCheck, version, initialState]);

  useEffect(() => {
    initialize(document.body);
  }, [initialize]);

  useEffect(() => {
    initializeMenu(
      document.querySelector('.ant-menu.ant-menu-root')?.parentElement
    );
  }, [initializeMenu]);

  const renderMenuHeader = useCallback(
    (logo, title) => {
      return (
        <>
          {logo}
          <div className="collapse-wrap">
            <Button
              style={{ marginRight: collapsed ? 0 : -14 }}
              size="small"
              type={collapsed ? 'default' : 'text'}
              onClick={handleToggleCollapse}
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
        siderWidth: layoutProps.siderWidth,
        collapsed: layoutProps.collapsed,
        showUpgrade
      });

      return dom;
    },
    [intl, version, updateCheck]
  );

  return (
    <div>
      <div className="background"></div>
      <ProLayout
        route={route}
        location={location}
        title={userConfig.title}
        navTheme="light"
        layout="side"
        disableMobile={true}
        siderWidth={220}
        onCollapse={(collapsed) => {
          setCollapsed(collapsed);
        }}
        onMenuHeaderClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          navigate('/');
        }}
        menuHeaderRender={renderMenuHeader}
        collapsed={collapsed}
        onPageChange={(route) => {
          const { location } = history;

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
        }}
        formatMessage={formatMessage}
        menu={{ locale: true }}
        logo={collapsed ? SLogoIcon : LogoIcon}
        menuItemRender={(menuItemProps, defaultDom) => {
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
        }}
        itemRender={(route, _, routes) => {
          const { breadcrumbName, title, path } = route;
          const label = title || breadcrumbName;
          const last = routes[routes.length - 1];
          if (last) {
            if (last.path === path || last.linkPath === path) {
              return <span>{label}</span>;
            }
          }
          return <Link to={path}>{label}</Link>;
        }}
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
    </div>
  );
};
