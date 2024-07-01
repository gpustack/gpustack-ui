import { atomWithStorage } from 'jotai/utils';

export const userAtom = atomWithStorage<any>('userInfo', null);

export const initialPasswordAtom = atomWithStorage<string>(
  'initialPassword',
  ''
);
