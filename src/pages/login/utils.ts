import { DEFAULT_ENTER_PAGE } from '@/config/settings';
import { getGPUStackPlugin } from '@/plugins';
import { isOnline } from '@/utils';
import {
  IS_FIRST_LOGIN,
  readState,
  writeState
} from '@/utils/localstore/index';
import { history, request } from '@umijs/max';

const resolvePluginPath = async (
  userInfo: any
): Promise<string | null | undefined> => {
  try {
    return await getGPUStackPlugin()?.login?.resolveDefaultPath?.(userInfo, {
      request
    });
  } catch {
    return null;
  }
};

export const checkDefaultPage = async (userInfo: any, replace: boolean) => {
  const [isFirstLogin, overridePath] = await Promise.all([
    readState(IS_FIRST_LOGIN),
    resolvePluginPath(userInfo)
  ]);

  if (isFirstLogin === null && isOnline()) {
    writeState(IS_FIRST_LOGIN, true);
    const pathname =
      overridePath ||
      (userInfo && userInfo?.is_admin
        ? DEFAULT_ENTER_PAGE.adminForFirst
        : DEFAULT_ENTER_PAGE.user);
    history.push(pathname);
    return;
  }
  await writeState(IS_FIRST_LOGIN, false);

  const pathname =
    overridePath ||
    (userInfo?.is_admin
      ? DEFAULT_ENTER_PAGE.adminForNormal
      : DEFAULT_ENTER_PAGE.user);

  history.push(pathname, { replace: replace });
};
