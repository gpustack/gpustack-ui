import { defaultSettings } from '@/atoms/settings';
import { nsLocal, nsSession } from '@gpustack/core-ui/utils';
import { getDefaultStore } from 'jotai';

interface JSONStorage<Value> {
  getItem: (key: string, initialValue: Value) => Value;
  setItem: (key: string, newValue: Value) => void;
  removeItem: (key: string) => void;
}

/**
 * `sessionStorage` flavour of core-ui's `nsLocalJSONStorage`, for
 * `atomWithStorage`. core-ui only ships the `localStorage` one; the
 * deploy-namespace prefix still comes from `nsSession`, which applies
 * `nsKey` itself.
 *
 * No `subscribe`: `sessionStorage` is per-tab, so the `storage` event
 * never fires for it and there is no other tab to sync from.
 */
export const nsSessionJSONStorage: JSONStorage<any> = {
  getItem: (key, initialValue) => {
    const raw = nsSession.get(key);
    if (raw == null) {
      return initialValue;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  },
  setItem: (key, newValue) => {
    nsSession.set(key, JSON.stringify(newValue));
  },
  removeItem: (key) => {
    nsSession.remove(key);
  }
};

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
