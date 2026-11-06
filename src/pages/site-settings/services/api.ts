import { SITE_SETTINGS_API } from '../config';
import type { FormData } from '../config/types';
import { parseSiteSettings } from '../config/validation';

export type Request = <T>(
  url: string,
  options?: Record<string, any>
) => Promise<T>;

export const querySiteSettings = (request: Request) =>
  request<unknown>(SITE_SETTINGS_API, {
    method: 'GET',
    skipErrorHandler: true
  }).then(parseSiteSettings);

export const updateSiteSettings = (request: Request, data: FormData) =>
  request<unknown>(SITE_SETTINGS_API, {
    method: 'PUT',
    data,
    skipErrorHandler: true
  }).then(parseSiteSettings);
