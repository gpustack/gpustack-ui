import { getGPUStackPlugin } from '@/plugins';
import type { RouteConfig } from '@/plugins/types';

type ClientRoute = RouteConfig & {
  id?: string;
  children?: ClientRoute[];
  routes?: ClientRoute[];
};

function getLayoutChildren(routes: ClientRoute[]): ClientRoute[] | null {
  const rootRoute = routes.find((route) => route.path === '/');
  if (!rootRoute) return null;

  const rootChildren = rootRoute.routes || rootRoute.children;
  if (!Array.isArray(rootChildren)) return null;

  const globalLayout = rootChildren.find((route) =>
    route.id?.includes('global-layout')
  );
  if (!globalLayout) return null;

  const layoutChildren = globalLayout.children || globalLayout.routes;
  return Array.isArray(layoutChildren) ? layoutChildren : null;
}

function mergeRoute(targetRoutes: ClientRoute[], pluginRoute: ClientRoute) {
  const existsIndex = targetRoutes.findIndex(
    (route) =>
      (pluginRoute.path && route.path === pluginRoute.path) ||
      (pluginRoute.key && route.key === pluginRoute.key)
  );

  if (existsIndex === -1) {
    targetRoutes.push(pluginRoute);
    return;
  }

  const currentRoute = targetRoutes[existsIndex];
  targetRoutes[existsIndex] = {
    ...currentRoute,
    ...pluginRoute,
    routes: pluginRoute.routes || currentRoute.routes,
    children: pluginRoute.children || currentRoute.children
  };
}

export function mergeEnterpriseRoutes(routes: ClientRoute[]) {
  const enterprisePlugin = getGPUStackPlugin();
  if (!enterprisePlugin?.routes?.length) return;

  const layoutChildren = getLayoutChildren(routes);
  if (!layoutChildren) return;

  enterprisePlugin.routes.forEach((route) =>
    mergeRoute(layoutChildren, route as ClientRoute)
  );
}
