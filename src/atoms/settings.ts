import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type UserSettings = {
  theme: 'light' | 'realDark' | 'auto';
};

export const userSettingsAtom = atomWithStorage<UserSettings>('userSettings', {
  theme: 'light'
});

export const userSettingsHelperAtom = atom(
  (get) => get(userSettingsAtom),
  (get, set, update: Partial<UserSettings>) => {
    const prev = get(userSettingsAtom);
    set(userSettingsAtom, {
      ...prev,
      ...(update || {})
    });
  }
);
