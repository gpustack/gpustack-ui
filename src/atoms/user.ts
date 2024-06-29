import { atomWithStorage } from 'jotai/utils';

export const userAtom = atomWithStorage<any>('userInfo', null);
