import { BASE_PATH } from '@/config/settings';

/**
 * Prefix an app-relative request path with the mount prefix.
 *
 * Only for requests issued through raw `fetch` — streaming bodies, blob
 * downloads and form posts that need a `Response` the app's axios instance
 * does not hand back. Axios applies `BASE_PATH` through its own `baseURL`, so
 * routing an already-prefixed URL through here would double the prefix.
 *
 * An absolute (`https://host/x`) or protocol-relative (`//host/x`) URL names
 * its own host and is returned untouched. So is a path with no leading slash,
 * which the browser already resolves against the document — but prefer passing
 * a rooted path, since document-relative resolution silently depends on the
 * page URL keeping its trailing slash.
 */
export const withBasePath = (url: string): string => {
  if (!url.startsWith('/') || url.startsWith('//')) {
    return url;
  }
  return `${BASE_PATH}${url}`;
};
