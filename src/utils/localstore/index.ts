import localStore from './store';

const IS_FIRST_LOGIN = 'is_first_login';

const REMEMBER_ME_KEY = 'r_m';
const CRYPT_TEXT = 'seal';

const store = localStore.createInstance({ name: '_xWXJKJ_S1Sna_' });

const rememberMe = (key: string, data: any) => {
  if (store) {
    store.setItem(key, data);
  }
};

const getRememberMe = (key: string) => {
  if (store) {
    return store.getItem(key);
  }
};

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
  REMEMBER_ME_KEY,
  getRememberMe,
  readColumnSettings,
  readState,
  rememberMe,
  removeRememberMe,
  writeColumnSettings,
  writeState
};

export default store;
