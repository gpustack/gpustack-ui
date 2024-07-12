import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const userAtom = atomWithStorage<any>('userInfo', null);

export const GPUStackVersionAtom = atom<{
  version: string;
  git_commit: string;
}>({
  version: '',
  git_commit: ''
});

export const initialPasswordAtom = atomWithStorage<string>(
  'initialPassword',
  ''
);
