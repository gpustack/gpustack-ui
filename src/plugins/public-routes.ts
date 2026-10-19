import { matchRoutes } from 'react-router-dom';
import type { AppPlugin } from './types';

/** Match public routes against raw history paths, including Umi's deployment base. */
export const isPluginPublicPage = (
  pathname: string,
  plugins: Iterable<Pick<AppPlugin, 'publicRoutes'>>,
  basename = '/'
): boolean => {
  const routes = Array.from(plugins).flatMap(({ publicRoutes }) =>
    (publicRoutes ?? []).map((path) => ({ path }))
  );
  // Router normalizes its base before stripping it from the location. Its
  // standalone matcher does not do this consistently across Router versions.
  const normalizedBasename = basename.replace(/\/+$/, '').replace(/^\/*/, '/');
  return matchRoutes(routes, pathname, normalizedBasename) !== null;
};
