import localStore from './store';

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

export { getRememberMe, rememberMe, removeRememberMe };

export default store;
