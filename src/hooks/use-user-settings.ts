import { userSettingsHelperAtom } from '@/atoms/settings';
import themeConfig from '@/config/theme';
import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';

type Theme = 'light' | 'realDark' | 'auto';

export default function useUserSettings() {
  const { light, dark, colorPrimary } = themeConfig;
  const [userSettings, setUserSettings] = useAtom(userSettingsHelperAtom);

  const setHtmlThemeAttr = (theme: string) => {
    const html = document.querySelector('html');
    if (html) {
      html.setAttribute('data-theme', theme);
    }
  };

  const themeData = useMemo(() => {
    const themeTokens = userSettings.theme === 'realDark' ? dark : light;
    themeTokens.token.colorPrimary = userSettings.colorPrimary || colorPrimary;
    return {
      ...themeTokens
    };
  }, [userSettings.theme, userSettings.colorPrimary]);

  const setTheme = (theme: Theme) => {
    setHtmlThemeAttr(theme);
    setUserSettings({
      theme: theme,
      isDarkTheme: theme === 'realDark'
    });
  };

  useEffect(() => {
    setHtmlThemeAttr(userSettings.theme);
  }, [userSettings.theme]);

  useEffect(() => {
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'realDark' : 'light');
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleChange);

    if (userSettings.theme === 'auto') {
      setTheme(mediaQuery.matches ? 'realDark' : 'light');
    }
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [userSettings.theme]);

  return {
    userSettings,
    setUserSettings,
    setTheme,
    isDarkTheme: userSettings.isDarkTheme,
    themeData,
    componentSize: 'large'
  };
}
