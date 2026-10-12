import type { RoleSpec } from '../config/types';

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
  model: RecreationState
): { okText: string; tip?: string } => {
  if (model.roles?.length && model.stale) {
    return {
      okText: 'common.button.delete',
      tip: 'models.pd.instance.delete.stale'
    };
  }
  return { okText: 'common.button.delrecreate' };
};
