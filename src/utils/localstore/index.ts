import localStore from './store';

const IS_FIRST_LOGIN = 'is_first_login';

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

export {
  IS_FIRST_LOGIN,
  getRememberMe,
  readState,
  rememberMe,
  removeRememberMe,
  writeState
};

export default store;
