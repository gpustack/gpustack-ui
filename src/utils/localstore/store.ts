import dayjs from 'dayjs';
import localForage from 'localforage';
import { get } from 'lodash';

class Localestore extends Object.getPrototypeOf(localForage).constructor {
  constructor() {
    super();
    this.state = {};
  }

  public async removeValue(key: string) {
    return localForage.removeItem(key);
  }

  public async setValue(
    key: string,
    value: any,
    callback?: (args?: any) => void,
    expire?: number
  ) {
    if (!expire) {
      return localForage.setItem(key, { value }, callback);
    }
    return localForage.setItem(
      key,
      {
        value,
        expire: {
          expire,
          createTime: dayjs().valueOf(),
          expiration: dayjs().add(expire, 'day').valueOf()
        }
      },
      callback
    );
  }

  public async getValue(key: string, callback?: (args?: any) => void) {
    const storeValue = await localForage.getItem(key, callback);

    const expire = get(storeValue, 'expire');
    if (!expire) return storeValue;
    const expiration = get(expire, 'expiration');
    return {
      value: get(storeValue, 'value'),
      isExpiration: dayjs().isAfter(expiration)
    };
  }
}

export default new Localestore();
