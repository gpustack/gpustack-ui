import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import { COLOR_PRIMARY } from '@/config/theme/constants';
import useUserSettings from '@/hooks/use-user-settings';
import useUserSettingsStorage from '@/hooks/use-user-settings-storage';
import type { CoreUIProvider } from '@gpustack/core-ui';
import { getAllLocales, setLocale, useIntl } from '@umijs/max';
import type { ComponentProps } from 'react';

type ProviderProps = ComponentProps<typeof CoreUIProvider>;
type SharedProviderProps = Pick<ProviderProps, 'config' | 'i18n' | 'locale'> & {
  hooks: Pick<
    ProviderProps['hooks'],
    'useUserSettings' | 'useUserSettingsStorage' | 'useIntl'
  >;
};

const useCoreUIUserSettings = () => {
  const settings = useUserSettings();
  return {
    ...settings,
    setTheme: (mode: string) => {
      if (mode === 'light' || mode === 'realDark' || mode === 'auto') {
        settings.setTheme(mode);
      }
    }
  };
};

// Assemble shared props without calling hooks or moving the entry's providers.
// Requests, navigation and identity remain wired by each entry.
export const getCoreUIProviderProps = (
  userSettings: Pick<
    ReturnType<typeof useUserSettings>['userSettings'],
    'theme' | 'isDarkTheme'
  >,
  intl: ProviderProps['i18n']
): SharedProviderProps => ({
  config: {
    apiBaseUrl: GPUSTACK_API_BASE_URL,
    theme: userSettings.theme,
    isDarkTheme: userSettings.isDarkTheme,
    iconUrl: '',
    defaultColorPrimary: COLOR_PRIMARY
  },
  hooks: {
    useUserSettings: useCoreUIUserSettings,
    useUserSettingsStorage,
    useIntl
  },
  i18n: intl,
  locale: { getAllLocales, setLocale }
});
