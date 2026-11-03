import type { SiteSettings } from './types';

export const SITE_SETTINGS_API = '/site-settings';
export const SITE_SETTINGS_PUBLIC_API = `${SITE_SETTINGS_API}/public`;

export const defaultSiteSettings: SiteSettings = {
  site_name: 'GPUStack',
  primary_color: '#007BFF',
  logo: null,
  logo_dark: null,
  mini_logo: null,
  mini_logo_dark: null,
  favicon: null,
  footer_name: null,
  footer_url: null,
  updated_at: null
};

export const resolveSiteSettings = (
  settings: Partial<SiteSettings> | null | undefined
): SiteSettings => ({
  ...defaultSiteSettings,
  ...(settings || {})
});

export const resolveSiteLogo = (
  settings: SiteSettings,
  kind: 'sidebar' | 'mini',
  isDarkTheme: boolean
) => {
  const light = kind === 'sidebar' ? settings.logo : settings.mini_logo;
  const dark =
    kind === 'sidebar' ? settings.logo_dark : settings.mini_logo_dark;
  return (isDarkTheme ? dark || light : light) || undefined;
};

export { type SiteSettings };
