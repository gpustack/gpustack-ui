import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type UserSettings = {
  theme: 'light' | 'realDark' | 'auto';
  isDarkTheme?: boolean;
};

export const userSettingsAtom = atomWithStorage<UserSettings>('userSettings', {
  theme: 'light',
  isDarkTheme: false
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
      isDarkTheme: newSettings.theme === 'realDark'
    });
  }
);
