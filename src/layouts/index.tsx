// @ts-nocheck

/// <reference types="@ant-design/pro-components" />

import { useAccessMarkedRoutes } from '@@/plugin-access';
import { useModel } from '@@/plugin-model';
import { ProLayout } from '@ant-design/pro-components';
import {
  Link,
  Outlet,
  matchRoutes,
  useAppData,
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
const mapRoutes = (routes: IRoute[]) => {
  if (routes.length === 0) {
    return [];
  }
  return routes.map((route) => {
    // 需要 copy 一份, 否则会污染原始数据
    const newRoute = { ...route };
    if (route.originPath) {
      newRoute.path = route.originPath;
    }

    if (Array.isArray(route.routes)) {
      newRoute.routes = mapRoutes(route.routes);
    }

    if (Array.isArray(route.children)) {
      newRoute.children = mapRoutes(route.children);
    }

    return newRoute;
  });
};

export default (props: any) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clientRoutes, pluginManager } = useAppData();

  const initialInfo = (useModel && useModel('@@initialState')) || {
    initialState: undefined,
    loading: false,
    setInitialState: null
  };
  const { initialState, loading, setInitialState } = initialInfo;

  const userConfig = {
    title: '',
    layout: 'mix'
  };

  const formatMessage = undefined;

  const runtimeConfig = pluginManager.applyPlugins({
    key: 'layout',
    type: 'modify',
    logout: true,
    initialValue: {
      ...initialInfo,
      notFound: <div>not found</div>
    }
  });
  console.log(
    'clientRoute==========2=',
    clientRoutes,
    runtimeConfig,
    initialInfo
  );

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
  console.log('clientRoutes===========', clientRoutes, newRoutes);
  const [route] = useAccessMarkedRoutes(mapRoutes(newRoutes));
  patchRoutes({ routes: route?.children || [] });

  const matchedRoute = useMemo(
    () => matchRoutes(route?.children || [], location.pathname)?.pop?.()?.route,
    [location.pathname]
  );
  console.log('route===========', route);
  return (
    <ProLayout
      route={route}
      location={location}
      title={userConfig.title}
      navTheme="light"
      siderWidth={270}
      onMenuHeaderClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        navigate('/');
      }}
      onPageChange={(route) => {
        console.log('onRouteChange', route);
      }}
      formatMessage={userConfig.formatMessage || formatMessage}
      menu={{ locale: userConfig.locale }}
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
            setInitialState
          });
          if (runtimeConfig.rightContentRender) {
            return runtimeConfig.rightContentRender(layoutProps, dom, {
              // BREAK CHANGE userConfig > runtimeConfig
              userConfig,
              runtimeConfig,
              loading,
              initialState,
              setInitialState
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
  );
};
