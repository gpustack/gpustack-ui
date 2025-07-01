import { colorPrimary } from '@/config/theme';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type UserSettings = {
  theme: 'light' | 'realDark';
  mode: 'light' | 'realDark' | 'auto';
  colorPrimary: string;
  isDarkTheme: boolean;
  collapsed: boolean;
};

const defaultSettings: UserSettings = {
  theme: 'light',
  mode: 'auto',
  isDarkTheme: false,
  colorPrimary: colorPrimary,
  collapsed: false
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

export const userSettingsAtom = atomWithStorage<UserSettings>(
  'userSettings',
  defaultSettings
);

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
      colorPrimary: newSettings.colorPrimary || colorPrimary,
      isDarkTheme: newSettings.theme === 'realDark'
    });
  }
);
