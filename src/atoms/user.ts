import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const userAtom = atomWithStorage<any>('userInfo', null);

export const GPUStackVersionAtom = atom<{
  version: string;
  git_commit: string;
  isProd: boolean;
  isDev?: boolean;
  isRc?: boolean;
}>({
  version: '',
  git_commit: '',
  isProd: false,
  isDev: false,
  isRc: false
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

export const getCurrentOrganizationId = (): string => {
  try {
    const raw = localStorage.getItem('currentOrganizationId');
    if (raw) {
      const value = JSON.parse(raw);
      if (value != null) return String(value);
    }
  } catch {}
  return 'gpustack-organization-1';
};
