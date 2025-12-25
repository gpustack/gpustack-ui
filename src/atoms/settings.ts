import { COLOR_PRIMARY } from '@/config/theme';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type UserSettings = {
  theme: 'light' | 'realDark';
  mode: 'light' | 'realDark' | 'auto';
  colorPrimary: string;
  isDarkTheme: boolean;
  collapsed: boolean;
  hideAddResourceModal?: boolean;
};

export const defaultSettings: UserSettings = {
  theme: 'light',
  mode: 'auto',
  isDarkTheme: false,
  colorPrimary: COLOR_PRIMARY,
  collapsed: false,
  hideAddResourceModal: false
};

export const getStorageUserSettings = () => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const savedSettings = JSON.parse(
      localStorage.getItem('userSettings') || '{}'
    );
    return {
      ...defaultSettings,
      ...savedSettings
    };
  } catch {
    return defaultSettings;
  }
};

export const userSettingsAtom = atomWithStorage<UserSettings>('userSettings', {
  ...getStorageUserSettings()
});

export const userSettingsHelperAtom = atom(
  (get) => get(userSettingsAtom),
  (get, set, update: Partial<UserSettings>) => {
    const prev = get(userSettingsAtom);
    const newSettings = {
      ...prev,
      ...(update || {})
    };
    set(userSettingsAtom, {
      ...newSettings,
      colorPrimary: newSettings.colorPrimary || COLOR_PRIMARY,
      isDarkTheme: newSettings.theme === 'realDark'
    });
  }
);
export const hideModalTemporarilyAtom = atom<boolean>(false);
