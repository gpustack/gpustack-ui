import { getDefaultStore } from 'jotai';

export const clearStorageUserSettings = () => {
  const savedSettings = JSON.parse(
    localStorage.getItem('userSettings') || '{}'
  );
  localStorage.setItem(
    'userSettings',
    JSON.stringify({
      ...savedSettings,
      colorPrimary: undefined
    })
  );
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
