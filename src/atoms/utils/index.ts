import { getDefaultStore } from 'jotai';

export const clearAtomStorage = (atom: any) => {
  if (!atom) {
    return;
  }
  const store = getDefaultStore();
  store.set(atom, null);
};

export const getAtomStorage = (atom: any) => {
  if (!atom) {
    return null;
  }
  const store = getDefaultStore();
  return store.get(atom);
};
