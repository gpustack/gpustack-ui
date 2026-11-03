import { SITE_SETTINGS_API } from '../config';
import type { FormData, SiteSettings } from '../config/types';

export type Request = <T>(
  url: string,
  options?: Record<string, any>
) => Promise<T>;

export const querySiteSettings = (request: Request) =>
  request<SiteSettings>(SITE_SETTINGS_API, {
    method: 'GET',
    skipErrorHandler: true
  });

export const updateSiteSettings = (request: Request, data: FormData) =>
  request<SiteSettings>(SITE_SETTINGS_API, {
    method: 'PUT',
    data,
    skipErrorHandler: true
  });
