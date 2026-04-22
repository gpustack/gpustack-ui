import { userSettingsHelperAtom } from '@/atoms/settings';
import { getAtomStorage, setAtomStorage } from '@/atoms/utils';

export default function useUserSettingsStorage() {
  const setStorageUserSettings = (value: Record<string, any>) => {
    setAtomStorage(userSettingsHelperAtom, value || {});
  };

  const getStorageUserSettings = () => {
    return getAtomStorage(userSettingsHelperAtom);
  };

  return {
    setStorageUserSettings,
    getStorageUserSettings
  };
}
