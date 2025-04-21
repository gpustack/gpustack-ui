import { userSettingsHelperAtom } from '@/atoms/settings';
import themeConfig from '@/config/theme';
import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';

type Theme = 'light' | 'realDark' | 'auto';

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

  // set theme by system theme: only for theme is auto
  useEffect(() => {
    if (userSettings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      console.log('mediaQuery', mediaQuery);
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'realDark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      handleChange(mediaQuery);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
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
