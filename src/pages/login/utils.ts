import { isOnline } from '@/utils';
import {
  IS_FIRST_LOGIN,
  readState,
  writeState
} from '@/utils/localstore/index';
import { history } from '@umijs/max';

export const checkDefaultPage = async (userInfo: any, replace: boolean) => {
  const isFirstLogin = await readState(IS_FIRST_LOGIN);

  if (isFirstLogin === null && isOnline()) {
    writeState(IS_FIRST_LOGIN, true);
    const pathname =
      userInfo && userInfo?.is_admin ? '/models/deployments' : '/playground';
    history.push(pathname);
    return;
  }
  await writeState(IS_FIRST_LOGIN, false);

  const pathname = userInfo?.is_admin ? '/dashboard' : '/playground';

  history.push(pathname, { replace: replace });
};
