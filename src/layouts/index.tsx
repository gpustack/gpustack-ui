// @ts-nocheck

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
import { useMemo } from 'react';
import Exception from './Exception';
import './Layout.css';
import Logo from './Logo';
import { getRightRenderContent } from './rightRender';
import { patchRoutes } from './runtime';

const loginPath = '/login';

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

// 格式化路由 处理因 wrapper 导致的 菜单 path 不一致
const mapRoutes = (routes: IRoute[], role: string) => {
  if (routes.length === 0) {
    return [];
  }
  return routes.map((route) => {
    // 需要 copy 一份, 否则会污染原始数据
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
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();
  const { clientRoutes, pluginManager } = useAppData();

  const initialInfo = (useModel && useModel('@@initialState')) || {
    initialState: undefined,
    loading: false,
    setInitialState: null
  };
  console.log('initialInfo==========', initialInfo);
  const { initialState, loading, setInitialState } = initialInfo;

  const userConfig = {
    title: '',
    layout: 'mix',
    locale: true
  };

  const formatMessage = (args) => {
    console.log('formatMessage', args);
    return intl.formatMessage({ id: args.id });
  };

  const runtimeConfig = {
    ...initialInfo,
    logout: async (userInfo) => {
      console.log('logout', userInfo);
      await logout();
      navigate(loginPath);
    },
    notFound: <span>404 not found</span>
  };

  // 现在的 layout 及 wrapper 实现是通过父路由的形式实现的, 会导致路由数据多了冗余层级, proLayout 消费时, 无法正确展示菜单, 这里对冗余数据进行过滤操作
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
        siderWidth={220}
        onMenuHeaderClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          navigate('/');
        }}
        onPageChange={(route) => {
          console.log('onRouteChange', initialState, route);
          const { location } = history;
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
        logo={Logo}
        menuItemRender={(menuItemProps, defaultDom) => {
          console.log('meurender=========', { defaultDom });
          if (menuItemProps.isUrl || menuItemProps.children) {
            return defaultDom;
          }
          if (menuItemProps.path && location.pathname !== menuItemProps.path) {
            return (
              // handle wildcard route path, for example /slave/* from qiankun
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
        rightContentRender={
          runtimeConfig.rightContentRender !== false &&
          ((layoutProps) => {
            const dom = getRightRenderContent({
              runtimeConfig,
              loading,
              initialState,
              setInitialState,
              intl
            });
            if (runtimeConfig.rightContentRender) {
              return runtimeConfig.rightContentRender(layoutProps, dom, {
                // BREAK CHANGE userConfig > runtimeConfig
                userConfig,
                runtimeConfig,
                loading,
                initialState,
                setInitialState,
                intl
              });
            }
            return dom;
          })
        }
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
