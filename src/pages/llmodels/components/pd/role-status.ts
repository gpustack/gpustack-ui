import { RoleLabelMap, RoleOrder, RoleValueMap } from '../../config';
import { RoleSpec, RoleStatus } from '../../config/types';

// Only what these helpers actually call, so they stay pure and testable and do
// not drag react-intl's types into a transform module.
type IntlLike = {
  formatMessage: (
    descriptor: { id: string },
    values?: Record<string, any>
  ) => string;
};

export interface RoleStatusItem extends RoleStatus {
  name: string;
}

/**
 * Per-role readiness, in the order the roles run in.
 *
 * `role_status` first: it is the only source carrying a `ready` count, and the
 * only one the *list* response carries at all — the list endpoint returns
 * models without their instances, which is exactly why the field exists.
 * The spec is the fallback, so a group that has never been reconciled shows
 * the shape it declared rather than a column of zeros.
 *
 * A role name the UI does not know is appended rather than dropped: the data
 * model allows any name, and silently hiding a member is the failure mode this
 * whole view exists to defeat.
 */
export const orderedRoleStatus = (
  roleStatus?: Record<string, RoleStatus> | null,
  roles?: Pick<RoleSpec, 'name' | 'replicas'>[] | null
): RoleStatusItem[] => {
  const source: Record<string, RoleStatus> =
    roleStatus && Object.keys(roleStatus).length
      ? roleStatus
      : (roles || []).reduce<Record<string, RoleStatus>>((acc, role) => {
          acc[role.name] = {
            desired: role.replicas ?? 0,
            ready: 0,
            draining: 0
          };
          return acc;
        }, {});

  const names = Object.keys(source);
  return [
    ...RoleOrder.filter((name) => names.includes(name)),
    ...names.filter((name) => !RoleOrder.includes(name))
  ].map((name) => ({
    name,
    desired: source[name]?.desired ?? 0,
    ready: source[name]?.ready ?? 0,
    draining: source[name]?.draining ?? 0
  }));
};

/**
 * How many of this role's members are on their way out, or null for none.
 *
 * 🔑 **The one member a reader cannot account for.** Someone looking at an
 * expanded group counts rows, and during a scale-down the rows outnumber
 * `ready`: a prefill scaled from 3 to 1 reads «1 / 1» — one serving, one
 * wanted, both correct — above three rows. Every other kind of surplus
 * explains itself, because a member that is merely unready is the gap between
 * `ready` and `desired` and its own row says «Starting». A drained member sits
 * outside both numbers.
 *
 * Printing the member total instead would close the same arithmetic gap and
 * say less: the reader would still have to subtract, and would still not know
 * what the extra member was doing.
 */
export const roleDrainingCount = (item: RoleStatusItem): number | null =>
  (item.draining ?? 0) > 0 ? (item.draining as number) : null;

/** A role short of the members it was asked for. */
export const isRoleWaiting = (item: RoleStatusItem) =>
  item.ready < item.desired;

/**
 * A role carrying more members than it was asked for — a scale-down that has
 * not finished.
 *
 * Not the same question as `isRoleWaiting`, and the two are mutually
 * exclusive: this role is *over* its target, not short of it.
 *
 * 🔑 **Only `role_status` can answer this on a collapsed row.** The list
 * response carries no instances, so `draining_since` — which does say this,
 * per member — is out of reach for exactly the row this is read on.
 *
 * Two signals, and the weaker one is not a fallback for the stronger one being
 * absent — it covers a case the stronger one does not:
 *
 * - **`draining`** is the fact itself, and the only one that can distinguish a
 *   member inside its window from one that should have gone and has not. A
 *   server that predates the field sends nothing.
 * - **`ready > desired`** is the symptom, and it is *always* worth the colour.
 *   The surplus has one cause — a scale-down that has not converged — and the
 *   two ways it fails to converge both want saying: the member is waiting out
 *   its drain window (normal, clears itself), or victim selection returned
 *   nothing and the role is stuck over target indefinitely (not normal, and
 *   nothing else on the row would ever mention it).
 */
export const isRoleDraining = (item: RoleStatusItem) =>
  (item.draining ?? 0) > 0 || item.ready > item.desired;

/**
 * How far along the lifecycle a member is, lowest first.
 *
 * Used to pick which of a role's unready members speaks for the role: the
 * least advanced one does, because the role is ready only once all of them
 * are, so the slowest member is what the role is actually waiting on.
 */
export interface RoleRatio {
  configured: string;
  current: string;
  waiting: string[];
}

/**
 * The group's declared ratio against the one it is actually running.
 *
 * Read off the non-router roles: the ratio is what makes a group a 3P1D rather
 * than a 4P4D, and the router is always one, so including it would only append
 * a meaningless `:1`. Null when there is nothing to say — fewer than two
 * shaping roles, or a group already at the shape it asked for.
 */
export const roleRatio = (items: RoleStatusItem[]): RoleRatio | null => {
  const shaping = items.filter((item) => item.name !== RoleValueMap.Router);
  if (shaping.length < 2) {
    return null;
  }
  const waiting = shaping.filter(isRoleWaiting);
  if (!waiting.length) {
    return null;
  }
  // Nothing running yet is not a ratio. `0:0` is not a shape the group is
  // holding, it is the absence of one, and the role headings below already say
  // which roles are still waiting -- so on a group that has just been created
  // this line said, in a third place and in alarm colour, what two other
  // places said plainly. The comparison only becomes information once the
  // group is running a shape other than the one it asked for: a 3P1D serving
  // as 1P1D.
  if (!shaping.some((item) => item.ready > 0)) {
    return null;
  }
  return {
    configured: shaping.map((item) => item.desired).join(':'),
    current: shaping.map((item) => item.ready).join(':'),
    waiting: waiting.map((item) => item.name)
  };
};

/** A role's display name; an unknown role falls back to its raw value. */
export const roleLabel = (intl: IntlLike, name: string) =>
  RoleLabelMap[name] ? intl.formatMessage({ id: RoleLabelMap[name] }) : name;
