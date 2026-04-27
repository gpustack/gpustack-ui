import GpustackLogo from '@/assets/images/gpustack-logo.png';
import SmallLogo from '@/assets/images/small-logo-200x200.png';
import useUserSettings from '@/hooks/use-user-settings';
import { getGPUStackPlugin } from '@/plugins';

const useLogo = () => {
  const { isDarkTheme, userSettings } = useUserSettings();

  const enterprisePlugin = getGPUStackPlugin();
  const resolved =
    enterprisePlugin?.branding?.resolveLogos?.(userSettings, isDarkTheme) ?? {};

  return {
    sidebarLogo: resolved.sidebarLogo || GpustackLogo,
    miniLogo: resolved.miniLogo || SmallLogo
  };
};

export { useLogo };
