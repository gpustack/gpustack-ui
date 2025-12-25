import { defaultSettings } from '@/atoms/settings';
import { getDefaultStore } from 'jotai';

export const clearStorageUserSettings = () => {
  try {
    const savedSettings = JSON.parse(
      localStorage.getItem('userSettings') || '{}'
    );
    localStorage.setItem(
      'userSettings',
      JSON.stringify({
        ...savedSettings,
        hideAddResourceModal: false,
        colorPrimary: undefined
      })
    );
  } catch (error) {
    console.log('Error clearing user settings:', error);
  }
};

export const resetStorageUserSettings = () => {
  try {
    localStorage.setItem(
      'userSettings',
      JSON.stringify({
        ...defaultSettings,
        colorPrimary: undefined
      })
    );
  } catch (error) {
    console.log('Error clearing user settings:', error);
  }
};

export const clearAtomStorage = (atom: any) => {
  if (!atom) {
    return;
  }
  const store = getDefaultStore();
  store.set(atom, null);
};

export const setAtomStorage = (atom: any, value: any) => {
  if (!atom) {
    return;
  }
  const store = getDefaultStore();
  store.set(atom, value);
};
export const getAtomStorage = (atom: any): any => {
  if (!atom) {
    return null;
  }
  const store = getDefaultStore();
  return store.get(atom);
};
