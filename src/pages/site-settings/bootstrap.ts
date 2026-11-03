import { userSettingsHelperAtom } from '@/atoms/settings';
import { siteSettingsAtom } from '@/atoms/site-settings';
import { setAtomStorage } from '@/atoms/utils';
import {
  defaultSiteSettings,
  resolveSiteSettings,
  SITE_SETTINGS_PUBLIC_API
} from './config';
import type { SiteSettings } from './config/types';
import type { Request } from './services/api';

export const applySiteSettings = (settings: SiteSettings) => {
  setAtomStorage(siteSettingsAtom, settings);
  setAtomStorage(userSettingsHelperAtom, {
    colorPrimary: settings.primary_color
  });
  document.title = settings.site_name;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = settings.favicon || '/static/favicon.png';
};

export const loadSiteSettings = async (
  request: Request
): Promise<SiteSettings> => {
  let settings = defaultSiteSettings;
  try {
    const response = await request<SiteSettings>(SITE_SETTINGS_PUBLIC_API, {
      method: 'GET',
      skipErrorHandler: true,
      timeout: 5000
    });
    // An older server may serve the SPA fallback instead of this API.
    if (
      response &&
      typeof response.site_name === 'string' &&
      /^#[0-9a-fA-F]{6}$/.test(response.primary_color)
    ) {
      settings = resolveSiteSettings(response);
    }
  } catch {
    // Branding must never prevent authentication on an older or unavailable server.
  }
  applySiteSettings(settings);
  return settings;
};
