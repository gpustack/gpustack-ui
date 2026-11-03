import GpustackLogo from '@/assets/images/gpustack-logo.png';
import SmallLogo from '@/assets/images/small-logo-200x200.png';
import useSiteSettings from '@/hooks/use-site-settings';
import useUserSettings from '@/hooks/use-user-settings';
import { resolveSiteLogo } from '@/pages/site-settings/config';
import { getGPUStackPlugin } from '@/plugins';

const useLogo = () => {
  const { isDarkTheme, userSettings } = useUserSettings();

  const settings = useSiteSettings();
  const enterprisePlugin = getGPUStackPlugin();
  const resolved =
    enterprisePlugin?.branding?.resolveLogos?.(userSettings, isDarkTheme) ?? {};

  return {
    siteName: settings.site_name,
    sidebarLogo:
      resolved.sidebarLogo ||
      resolveSiteLogo(settings, 'sidebar', isDarkTheme) ||
      GpustackLogo,
    miniLogo:
      resolved.miniLogo ||
      resolveSiteLogo(settings, 'mini', isDarkTheme) ||
      SmallLogo
  };
};

export { useLogo };
