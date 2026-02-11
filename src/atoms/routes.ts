import { atom } from 'jotai';

export const registerRouteConfigAtom = atom<Record<string, any>>({
  initialValues: null,
  create: false
});
