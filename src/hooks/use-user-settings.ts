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

  const initTheme = () => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'realDark'
      : 'light';
    if (userSettings.mode === 'auto' && systemTheme !== userSettings.theme) {
      setTheme('auto');
    }
  };

  useEffect(() => {
    initTheme();
  }, [userSettings.theme, userSettings.mode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // The theme follows the system preference, when the mode is set to 'auto'
      if (userSettings.mode !== 'auto') return;
      setTheme('auto');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [userSettings.mode, userSettings.theme]);

  return {
    userSettings,
    setUserSettings,
    setTheme,
    isDarkTheme: userSettings.isDarkTheme,
    themeData,
    componentSize: 'large'
  };
}
