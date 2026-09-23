import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import React from 'react';
import { InstanceDrainingLabel } from '../../config';
import { RoleSpec, RoleStatus } from '../../config/types';
import {
  orderedRoleStatus,
  roleDrainingCount,
  roleLabel,
  roleRatio
} from './role-status';

interface RoleStatusDetailProps {
  roleStatus?: Record<string, RoleStatus> | null;
  roles?: Pick<RoleSpec, 'name' | 'replicas'>[] | null;
  // Rendered under the per-role rows — the replica cell uses it to say why the
  // number is not editable there.
  footer?: React.ReactNode;
}

/**
 * Per-role `ready / desired`, plus the declared ratio when the group is short
 * of it.
 *
 * `role_status` is the backbone, and the only thing rendered from: it is the
 * per-role detail every *list* row has, expanded or not, so the same row says
 * the same thing either way.
 *
 * 🔴 A short role used to carry its members' own state here («Starting»,
 * «Pending»), read off the instances the expanded row had loaded. It is gone
 * because it could not agree with the member rows directly below it: the
 * instances reach a collapsed row only as whatever was last loaded, so the
 * word fell back to «Pending» while the rows underneath plainly read something
 * else. Stating a state twice from two sources is how they end up
 * contradicting each other — the counts are the one fact this surface owns,
 * and the member rows own the states. Saying it here again needs a state on
 * `RoleStatus` server-side, which does not exist.
 *
 * Styled for a tooltip surface (light text on the dark container), which is the
 * only place it is used.
 */
const RoleStatusDetail: React.FC<RoleStatusDetailProps> = ({
  roleStatus,
  roles,
  footer
}) => {
  const intl = useIntl();
  const items = orderedRoleStatus(roleStatus, roles);
  const ratio = roleRatio(items);

  if (!items.length) {
    return null;
  }

  return (
    <Flex
      vertical
      gap={4}
      style={{ color: 'var(--ant-color-text-light-solid)' }}
    >
      {items.map((item) => (
        <Flex key={item.name} align="center" justify="space-between" gap={16}>
          <span>{roleLabel(intl, item.name)}</span>
          <span>
            {item.ready} / {item.desired}
            {/* Accounts for the rows the fraction does not: a role scaled
                from 3 to 1 reads «1 / 1» with three members on screen. Same
                word the status column uses for the member itself, so the
                tooltip and the rows never spell one state two ways. */}
            {roleDrainingCount(item) !== null && (
              <span
                style={{
                  color: 'var(--ant-color-warning)',
                  marginInlineStart: 6
                }}
              >
                {roleDrainingCount(item)} {InstanceDrainingLabel.toLowerCase()}
              </span>
            )}
          </span>
        </Flex>
      ))}
      {!!ratio && (
        <span style={{ color: 'var(--ant-color-warning)' }}>
          {intl.formatMessage(
            { id: 'models.pd.ratio.waiting' },
            {
              configured: ratio.configured,
              current: ratio.current,
              role: ratio.waiting
                .map((name) => roleLabel(intl, name))
                .join(' / ')
            }
          )}
        </span>
      )}
      {footer}
    </Flex>
  );
};

export default RoleStatusDetail;
