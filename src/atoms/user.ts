import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const userAtom = atomWithStorage<any>('userInfo', null);

export const GPUStackVersionAtom = atom<{
  version: string;
  git_commit: string;
  isProduction: boolean;
}>({
  version: '',
  git_commit: '',
  isProduction: false
});

export const UpdateCheckAtom = atom<{
  latest_version: string;
}>({
  latest_version: ''
});

export const initialPasswordAtom = atomWithStorage<string>(
  'initialPassword',
  ''
);
