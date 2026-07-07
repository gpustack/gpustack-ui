import { defaultSettings } from '@/atoms/settings';
import { nsLocal } from '@gpustack/core-ui/utils';
import { getDefaultStore } from 'jotai';

export const clearStorageUserSettings = () => {
  try {
    const savedSettings = JSON.parse(nsLocal.get('userSettings') || '{}');
    // colorPrimary is an enterprise-wide branding setting (set by admins
    // and applied by `onAppInit` from /enterprise/settings), not a per-user
    // preference. Preserve it across login — otherwise the next layout
    // mount triggers `atomWithStorage.onMount`, re-reads localStorage,
    // and falls back to the default color until a full page refresh
    // re-runs `applyEnterpriseSettings`.
    nsLocal.set(
      'userSettings',
      JSON.stringify({
        ...savedSettings,
        hideAddResourceModal: false
      })
    );
  } catch (error) {
    console.log('Error clearing user settings:', error);
  }
};

export const resetStorageUserSettings = () => {
  try {
    nsLocal.set(
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
