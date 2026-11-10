import type { PDMode } from '../config/types';
import {
  routerCommandSource,
  type RouterBackendDefinition,
  type RouterCommandRole
} from './pd-router-command';

export type MembershipUpdatePolicy = 'dynamic' | 'restart' | 'manual';

export const membershipUpdatePolicy = (
  mode?: PDMode,
  roles?: readonly RouterCommandRole[] | null,
  definition?: RouterBackendDefinition
): MembershipUpdatePolicy | undefined => {
  const router = roles?.find((role) => role.name === 'router');
  const { command } = routerCommandSource(router, definition);
  // Without the selected backend definition, a client cannot infer whether
  // it uses custom flags or the recipe's dynamic registration API.
  if (
    !command &&
    router?.backend &&
    router.backend !== 'Custom' &&
    !definition
  ) {
    return undefined;
  }
  if (command?.trim()) {
    // Admission parses the restricted syntax. The UI only needs to recognize
    // peer values in expressions/loops, not mentions in literal CLI arguments.
    const expressions = command.match(/{{[\s\S]*?}}|{%[\s\S]*?%}/g) || [];
    const usesPeers = expressions.some((expression) =>
      /\b(prefill|decode|prefill_urls|decode_urls)\b/.test(
        expression.replace(/'[^']*'|"[^"]*"/g, '')
      )
    );
    return usesPeers && mode?.router ? 'restart' : 'manual';
  }
  return mode?.router?.membership_update;
};

export const membershipUpdateNotice = (
  mode?: PDMode,
  roles?: readonly RouterCommandRole[] | null,
  definition?: RouterBackendDefinition
): string | undefined => {
  const policy = membershipUpdatePolicy(mode, roles, definition);
  return policy ? `models.pd.membership.${policy}` : undefined;
};

export const routerMembershipUpdating = (message?: string): boolean =>
  !!message &&
  (message.includes('router membership changed; rebuilding router') ||
    message.includes('waiting for router startup after membership update'));
