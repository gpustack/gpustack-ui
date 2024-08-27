// @ts-nocheck

import { userAtom } from '@/atoms/user';
import ShortCuts, {
  modalConfig as ShortCutsConfig
} from '@/components/short-cuts';
import VersionInfo, { modalConfig } from '@/components/version-info';
import { logout } from '@/pages/login/apis';
import { useAccessMarkedRoutes } from '@@/plugin-access';
import { useModel } from '@@/plugin-model';
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
import { Modal } from 'antd';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
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

// 过滤出需要显示的路由, 这里的filterFn 指 不希望显示的层级
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
  const [userInfo] = useAtom(userAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();
  const { clientRoutes, pluginManager } = useAppData();
  const [collapsed, setCollapsed] = useState(false);

  const initialInfo = (useModel && useModel('@@initialState')) || {
    initialState: undefined,
    loading: false,
    setInitialState: null
  };

  // initialState: InitialStateType

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
  console.log('clientRoutes===========', route, clientRoutes, newRoutes);

  patchRoutes({
    routes: route.children,
    initialState: initialInfo.initialState
  });

  const matchedRoute = useMemo(
    () => matchRoutes(route?.children || [], location.pathname)?.pop?.()?.route,
    [location.pathname]
  );
  console.log('route===========', matchedRoute, route);
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
        onMenuHeaderClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          navigate('/');
        }}
        collapsed={collapsed}
        onCollapse={(collapsed) => {
          setCollapsed(collapsed);
        }}
        onPageChange={(route) => {
          const { location } = history;

          console.log('onPageChange', userInfo, initialState);
          if (
            location.pathname !== loginPath &&
            userInfo?.require_password_change
          ) {
            history.push(loginPath);

            return;
          }

          // 如果没有登录，重定向到 login

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
        actionsRender={(layoutProps) => {
          const dom = getRightRenderContent({
            runtimeConfig,
            loading,
            initialState,
            setInitialState,
            intl,
            siderWidth: layoutProps.siderWidth,
            collapsed: layoutProps.collapsed
          });

          return dom;
        }}
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
