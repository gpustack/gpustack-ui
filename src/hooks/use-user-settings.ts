import { userSettingsHelperAtom } from '@/atoms/settings';
import themeConfig from '@/config/theme';
import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';

type Theme = 'light' | 'realDark';

export default function useUserSettings() {
  const { light, dark } = themeConfig;
  const [userSettings, setUserSettings] = useAtom(userSettingsHelperAtom);

  const setHtmlThemeAttr = (theme: string) => {
    const html = document.querySelector('html');
    if (html) {
      html.setAttribute('data-theme', theme);
    }
  };

  const themeData = useMemo(() => {
    return {
      ...(userSettings.theme === 'realDark' ? dark : light)
    };
  }, [userSettings.theme]);

  const isDarkTheme = useMemo(() => {
    return userSettings.theme === 'realDark';
  }, [userSettings.theme]);

  const setTheme = (theme: Theme) => {
    setHtmlThemeAttr(theme);
    setUserSettings({ ...userSettings, theme: theme });
  };

  useEffect(() => {
    setHtmlThemeAttr(userSettings.theme);
  }, [userSettings.theme]);

  return {
    userSettings,
    setUserSettings,
    setTheme,
    isDarkTheme,
    themeData,
    componentSize: 'large'
  };
}
