import { atom, getDefaultStore } from 'jotai';

// models expand keys: create, update , delete,
export const modelsExpandKeysAtom = atom<string[]>([]);

export const requestIdAtom = atom<number>(0);

export const setRquestId = () => {
  const store = getDefaultStore();
  const id = Date.now();
  store.set(requestIdAtom, id);
  return id;
};

export const getRequestId = () => {
  const store = getDefaultStore();
  return store.get(requestIdAtom);
};
