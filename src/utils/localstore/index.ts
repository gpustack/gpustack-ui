import { NS_STORE_NAME } from '@gpustack/core-ui/utils';
import localStore from './store';

const IS_FIRST_LOGIN = 'is_first_login';

const REMEMBER_ME_KEY = 'r_m';
const CRYPT_TEXT = 'seal';

const store = localStore.createInstance({ name: NS_STORE_NAME });

// Kept to remove credentials saved by the old "remember me" feature.
const removeRememberMe = (key: string) => {
  if (store) {
    store.removeItem(key);
  }
};

const readState = (key: string) => {
  if (store) {
    return store.getItem(key);
  }
};

const writeState = (key: string, data: any) => {
  if (store) {
    store.setItem(key, data);
  }
};

const readColumnSettings = (key: string) => {
  return readState(key);
};

const writeColumnSettings = (key: string, data: any) => {
  writeState(key, data);
};

export {
  CRYPT_TEXT,
  IS_FIRST_LOGIN,
  readColumnSettings,
  readState,
  REMEMBER_ME_KEY,
  removeRememberMe,
  writeColumnSettings,
  writeState
};

export default store;
