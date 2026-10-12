import type { PDMode, RoleSpec } from '../config/types';

export type MembershipUpdatePolicy = 'dynamic' | 'restart' | 'manual';

export const membershipUpdatePolicy = (
  mode?: PDMode,
  roles?: readonly Partial<Pick<RoleSpec, 'name' | 'run_command'>>[] | null
): MembershipUpdatePolicy | undefined => {
  if (roles?.some((role) => role.name === 'router' && role.run_command)) {
    return 'manual';
  }
  return mode?.router?.membership_update;
};

export const membershipUpdateNotice = (
  mode?: PDMode,
  roles?: readonly Partial<Pick<RoleSpec, 'name' | 'run_command'>>[] | null
): string | undefined => {
  const policy = membershipUpdatePolicy(mode, roles);
  return policy ? `models.pd.membership.${policy}` : undefined;
};

export const routerMembershipUpdating = (message?: string): boolean =>
  !!message &&
  (message.includes('router membership changed; rebuilding router') ||
    message.includes('waiting for router startup after membership update'));
