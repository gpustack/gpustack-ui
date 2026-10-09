import { theme, type ThemeConfig } from 'antd';
import { COLOR_PRIMARY } from './constants';
import dark from './dark';
import light from './light';

export default function getThemeConfig(settings: {
  theme: 'light' | 'realDark';
  colorPrimary?: string;
}): ThemeConfig {
  const isDark = settings.theme === 'realDark';
  const base = isDark ? dark : light;

  return {
    ...base,
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      ...base.token,
      colorPrimary: settings.colorPrimary || COLOR_PRIMARY
    }
  };
}
