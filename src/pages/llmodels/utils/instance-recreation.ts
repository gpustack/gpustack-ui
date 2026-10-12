import type { PDMode, RoleSpec } from '../config/types';
import { membershipUpdatePolicy } from './pd-membership';

interface RecreationState {
  roles?: readonly Partial<RoleSpec>[] | null;
  stale?: boolean | null;
}

export const configurationChangeMessage = (
  hasRoles: boolean,
  instance = false
): string => {
  if (hasRoles) {
    return 'models.pd.recreation.paused';
  }
  return instance ? 'models.pd.instance.stale' : 'models.pd.stale';
};

export const instanceDeleteMessages = (
  model: RecreationState,
  mode?: PDMode
): { okText: string; tip?: string } => {
  if (model.roles?.length && model.stale) {
    return {
      okText: 'common.button.delete',
      tip: 'models.pd.instance.delete.stale'
    };
  }
  if (model.roles?.length) {
    const policy = membershipUpdatePolicy(mode, model.roles);
    if (policy === 'restart' || policy === 'manual') {
      return {
        okText: 'common.button.delrecreate',
        tip: `models.pd.instance.delete.${policy}`
      };
    }
  }
  return { okText: 'common.button.delrecreate' };
};
