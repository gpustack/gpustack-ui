import { userSettingsHelperAtom } from '@/atoms/settings';
import themeConfig from '@/config/theme';
import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';

type Theme = 'light' | 'realDark' | 'auto';

export default function useUserSettings() {
  const { light, dark, colorPrimary } = themeConfig;
  const [userSettings, setUserSettings] = useAtom(userSettingsHelperAtom);

  const getCurrentTheme = (mode: Theme): 'light' | 'realDark' => {
    if (mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'realDark'
        : 'light';
    }
    return mode;
  };

  const setHtmlThemeAttr = (theme: string) => {
    const html = document.querySelector('html');
    if (html) {
      html.setAttribute('data-theme', theme);
    }
  };

  const themeData = useMemo(() => {
    const baseTokens = userSettings.theme === 'realDark' ? dark : light;
    return {
      ...baseTokens,
      token: {
        ...baseTokens.token,
        colorPrimary: userSettings.colorPrimary || colorPrimary
      }
    };
  }, [userSettings.theme, userSettings.colorPrimary]);

  const setTheme = (mode: Theme) => {
    const currentTheme = getCurrentTheme(mode);
    setHtmlThemeAttr(currentTheme);
    setUserSettings({
      theme: currentTheme,
      mode: mode,
      isDarkTheme: currentTheme === 'realDark'
    });
  };

  useEffect(() => {
    setHtmlThemeAttr(userSettings.theme);
  }, [userSettings.theme]);

  useEffect(() => {
    if (userSettings.mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setTheme('auto');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [userSettings.mode]);

  return {
    userSettings,
    setUserSettings,
    setTheme,
    isDarkTheme: userSettings.isDarkTheme,
    themeData,
    componentSize: 'large'
  };
}
